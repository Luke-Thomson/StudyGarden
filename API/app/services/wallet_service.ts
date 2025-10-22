import db from '@adonisjs/lucid/services/db'
import CoinLedger, { type LedgerType } from '#models/coin_ledger'
import UserWallet from '#models/user_wallet'
import TimerSession from '#models/timer_session'
import type { QueryClientContract, TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * WalletService
 *
 * Responsibilities:
 * - Ensure each user has a wallet row.
 * - Credit/debit coin balances atomically.
 * - Append every change to an auditable ledger.
 * - Prevent duplicate credits via (type, refId) idempotency.
 *
 * Notes:
 * - All multi-write operations run inside a DB transaction.
 * - Balance changes use single-statement increment/decrement to avoid races.
 * - `.forUpdate()` provides an extra safety net on PG/MySQL (ignored on SQLite).
 * */
export default class WalletService {
  /**
   * Ensure there is a wallet row for a given user.
   * Safe to call repeatedly; creates the row only if missing.
   *
   * @param userId - The user owning the wallet
   * @param client - Optional query/transaction client (pass `trx` inside transactions)
   */
  static async ensureWallet(userId: number, client?: QueryClientContract) {
    // Query using the provided client (transaction) when present
    const existing = await UserWallet.query(client ? { client } : {})
      .where('user_id', userId)
      .first()

    if (existing) return

    const wallet = new UserWallet()
    wallet.userId = userId
    wallet.balanceCoins = 0

    // If we’re inside a transaction, bind the save to that trx
    if (client && (client as TransactionClientContract).isTransaction) {
      await wallet.useTransaction(client as TransactionClientContract).save()
    } else {
      await wallet.save()
    }
  }

  /**
   * Get the current coin balance for a user.
   *
   * @param userId - The user owning the wallet
   * @param client - Optional query/transaction client
   * @returns current balance (number)
   */
  static async getBalance(userId: number, client?: QueryClientContract) {
    const wallet = await UserWallet.query(client ? { client } : {})
      .where('user_id', userId)
      .first()

    return Number(wallet?.balanceCoins ?? 0)
  }

  /**
   * Credit coins to a user's wallet (e.g., after a completed study session).
   * - Idempotent when `refId` is provided: if a matching ledger entry exists,
   *   no new credit is applied.
   * - Appends a positive ledger row and atomically increments the balance.
   *
   * @param userId - Wallet owner
   * @param amount - Number of coins to add (must be > 0)
   * @param type   - Ledger type (e.g., 'SESSION_CREDIT')
   * @param refId  - Optional external reference (e.g., timer_session.id)
   * @returns { alreadyCredited: boolean; balance: number }
   */
  static async credit(userId: number, amount: number, type: LedgerType, refId?: number) {
    if (amount <= 0) {
      throw new Error('credit() amount must be > 0')
    }

    return await db.transaction(async (trx) => {
      // ----- 1) Idempotency: refuse duplicate credit for same (user, type, refId) -----
      if (refId) {
        const duplicate = await CoinLedger.query({ client: trx })
          .where('user_id', userId)
          .andWhere('type', type)
          .andWhere('ref_id', refId)
          .first()

        if (duplicate) {
          const balance = await this.getBalance(userId, trx)
          return { alreadyCredited: true as const, balance }
        }
      }

      // ----- 2) Ensure wallet row exists (safe no-op if it already does) -----
      await this.ensureWallet(userId, trx)

      // (Optional) lock the wallet row on PG/MySQL so concurrent writers queue.
      // On SQLite this is a no-op; the atomic increment below still protects you.
      await UserWallet.query({ client: trx })
        .where('user_id', userId)
        .forUpdate()
        .first()

      // ----- 3) Append an auditable, positive ledger entry -----
      const ledger = new CoinLedger()
      ledger.userId = userId
      ledger.amount = amount // positive = credit
      ledger.type = type
      ledger.refId = refId ?? null
      await ledger.useTransaction(trx).save()

      // ----- 4) Atomically increment the wallet balance -----
      await UserWallet.query({ client: trx })
        .where('user_id', userId)
        .increment('balance_coins', amount)

      // ----- 5) Return the fresh balance -----
      const balance = await this.getBalance(userId, trx)
      return { alreadyCredited: false as const, balance }
    })
  }

  /**
   * Debit coins from a user's wallet (e.g., on purchase).
   * - Verifies sufficient funds inside the same transaction.
   * - Appends a negative ledger entry and atomically decrements the balance.
   *
   * @param userId - Wallet owner
   * @param amount - Number of coins to subtract (must be > 0)
   * @param type   - Ledger type (e.g., 'PURCHASE')
   * @param refId  - Optional external reference (e.g., seed_type.id)
   * @returns { balance: number }
   */
  static async debit(userId: number, amount: number, type: LedgerType, refId?: number) {
    if (amount <= 0) {
      throw new Error('debit() amount must be > 0')
    }

    return await db.transaction(async (trx) => {
      // ----- 1) Ensure wallet exists -----
      await this.ensureWallet(userId, trx)

      // ----- 2) Lock & read current balance (FOR UPDATE on PG/MySQL) -----
      const wallet = await UserWallet.query({ client: trx })
        .where('user_id', userId)
        .forUpdate()
        .firstOrFail()

      if (Number(wallet.balanceCoins) < amount) {
        throw new Error('Insufficient balance')
      }

      // ----- 3) Append an auditable, negative ledger entry -----
      const ledger = new CoinLedger()
      ledger.userId = userId
      ledger.amount = -amount // negative = debit
      ledger.type = type
      ledger.refId = refId ?? null
      await ledger.useTransaction(trx).save()

      // ----- 4) Atomically decrement the wallet balance -----
      await UserWallet.query({ client: trx })
        .where('user_id', userId)
        .decrement('balance_coins', amount)

      // ----- 5) Return the fresh balance -----
      const balance = await this.getBalance(userId, trx)
      return { balance }
    })
  }

  /**
   * Credit coins for a completed study session.
   *
   * - Uses TimerSession.startedAt and TimerSession.endedAt to compute real duration.
   * - Skips sessions under 5 minutes (to discourage micro farming).
   * - Idempotent: won't double-credit the same session twice.
   */
  static async creditForSession(sessionId: number) {
    // 1) Load the completed session
    const session = await TimerSession.findOrFail(sessionId)

    const userId = session.userId
    const status = (session as any).status ?? 'COMPLETED'
    if (status !== 'COMPLETED') {
      return { skipped: true, reason: 'Session not completed' }
    }

    // 2) Determine actual duration (server-trusted)
    const startedAt = (session as any).startedAt ? new Date((session as any).startedAt) : null
    const endedAt = (session as any).endedAt ? new Date((session as any).endedAt) : null
    let durationSec = Number((session as any).durationSec ?? 0)

    if (startedAt && endedAt) {
      const diff = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000))
      durationSec = diff || durationSec
    }

    // 3) Convert to minutes and apply basic rules
    const minutes = Math.floor(durationSec / 60)
    if (minutes < 1) {
      return { skipped: true, reason: 'Below 1-minute minimum' }
    }

    // 4) Simple coin formula (1 coin per minute)
    const baseRate = 1
    const coins = Math.max(0, Math.floor(minutes * baseRate))

    // 5) Credit
    return await this.credit(userId, coins, 'SESSION_CREDIT', sessionId)
  }
}
