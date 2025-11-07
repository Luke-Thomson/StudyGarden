import db from '@adonisjs/lucid/services/db'
import CoinLedger, { type LedgerType } from '#models/coin_ledger'
import UserWallet from '#models/user_wallet'
import TimerSession from '#models/timer_session'
import type { QueryClientContract, TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * WalletService
 *
 * Handles:
 * - Creating and maintaining user wallets
 * - Atomic credit/debit operations
 * - Auditable ledger entries
 * - Idempotent crediting via (type, refId)
 */
export default class WalletService {
  /** Ensure a wallet exists for the given user (idempotent). */
  static async ensureWallet(userId: number, client?: QueryClientContract) {
    const query = UserWallet.query(client ? { client } : {})
    const existing = await query.where('user_id', userId).first()
    if (existing) return

    const wallet = new UserWallet()
    wallet.userId = userId
    wallet.balanceCoins = 0

    const trx = (client as TransactionClientContract)?.isTransaction
      ? (client as TransactionClientContract)
      : undefined

    trx ? await wallet.useTransaction(trx).save() : await wallet.save()
  }

  /** Get the current wallet balance for a user. */
  static async getBalance(userId: number, client?: QueryClientContract) {
    const wallet = await UserWallet.query(client ? { client } : {})
      .where('user_id', userId)
      .first()

    return Number(wallet?.balanceCoins ?? 0)
  }

  /** Helper to append a ledger entry within a transaction. */
  private static async appendLedger(
    trx: TransactionClientContract,
    userId: number,
    amount: number,
    type: LedgerType,
    refId?: number
  ) {
    const ledger = new CoinLedger()
    ledger.userId = userId
    ledger.amount = amount
    ledger.type = type
    ledger.refId = refId ?? null
    await ledger.useTransaction(trx).save()
  }

  /** Helper to increment/decrement wallet balance atomically. */
  private static async updateBalance(
    trx: QueryClientContract,
    userId: number,
    delta: number
  ) {
    const op = delta > 0 ? 'increment' : 'decrement'
    await (UserWallet.query({ client: trx }) as any)
      .where('user_id', userId)[op]('balance_coins', Math.abs(delta))
  }

  /** Credit coins to a user's wallet (idempotent via refId). */
  static async credit(
    userId: number,
    amount: number,
    type: LedgerType,
    refId?: number
  ) {
    if (amount <= 0) throw new Error('credit() amount must be > 0')

    return db.transaction(async (trx) => {
      // 1) Idempotency check
      if (refId) {
        const duplicate = await CoinLedger.query({ client: trx })
          .where({ user_id: userId, type, ref_id: refId })
          .first()

        if (duplicate) {
          const balance = await this.getBalance(userId, trx)
          return { alreadyCredited: true as const, balance }
        }
      }

      // 2) Ensure wallet and lock row
      await this.ensureWallet(userId, trx)
      await UserWallet.query({ client: trx }).where('user_id', userId).forUpdate().first()

      // 3) Append ledger & increment balance
      await this.appendLedger(trx, userId, amount, type, refId)
      await this.updateBalance(trx, userId, amount)

      // 4) Return updated balance
      const balance = await this.getBalance(userId, trx)
      return { alreadyCredited: false as const, balance }
    })
  }

  /** Debit coins from a user's wallet (checks balance atomically). */
  static async debit(
    userId: number,
    amount: number,
    type: LedgerType,
    refId?: number,
    client?: QueryClientContract
  ) {
    if (amount <= 0) throw new Error('debit() amount must be > 0')

    const run = async (trx: TransactionClientContract) => {
      await this.ensureWallet(userId, trx)

      const wallet = await UserWallet.query({ client: trx })
        .where('user_id', userId)
        .forUpdate()
        .firstOrFail()

      if (Number(wallet.balanceCoins) < amount) throw new Error('Insufficient balance')

      await this.appendLedger(trx, userId, -amount, type, refId)
      await this.updateBalance(trx, userId, -amount)

      const balance = await this.getBalance(userId, trx)
      return { balance }
    }

    return client ? run(client as TransactionClientContract) : db.transaction(run)
  }

  /** Credit coins for a completed TimerSession. (idempotent) */
  static async creditForSession(sessionId: number) {
    const session = await TimerSession.findOrFail(sessionId)
    const { userId } = session
    const status = (session as any).status ?? 'COMPLETED'

    if (status !== 'COMPLETED')
      return { skipped: true, reason: 'Session not completed' }

    const startedAt = session.startedAt?.toJSDate() ?? null
    const endedAt = session.endedAt?.toJSDate() ?? null
    const durationSec =
      startedAt && endedAt
        ? Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000))
        : Number((session as any).durationSec ?? 0)

    const minutes = Math.floor(durationSec / 60)
    if (minutes < 1)
      return { skipped: true, reason: 'Below 1-minute minimum' }

    const coins = Math.floor(minutes * 1) // 1 coin per minute
    const creditResult = await this.credit(userId, coins, 'SESSION_CREDIT', sessionId)

    return { ...creditResult, coins }
  }
}
