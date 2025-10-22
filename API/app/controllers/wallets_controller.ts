import type { HttpContext } from '@adonisjs/core/http'
import WalletService from '#services/wallet_service'
import CoinLedger from '#models/coin_ledger'
import { walletAdjustValidator } from '#validators/wallet_adjust'


export default class WalletsController {
  /**
   * GET /me/wallet
   * Returns the user's current coin balance
   */
  async show({ auth }: HttpContext) {
    const user = auth.user!
    const balance = await WalletService.getBalance(user.id)
    return balance
  }

  /**
   * GET /me/coins/ledger
   */
  async ledger({ auth }: HttpContext) {
    const user = auth.user!

    const rows = await CoinLedger.query()
      .where('user_id', user.id)

    return rows
  }

  /**
   * POST /wallet/adjust
   */
  async adjust({ auth, request, response }: HttpContext) {
    const admin = await auth.authenticate()
    const { userId, amount } = await request.validateUsing(walletAdjustValidator)

    // Target user: provided userId or the admin themselves
    const targetUserId = userId ?? admin.id

    try {
      if (amount > 0) {
        // credit
        const res = await WalletService.credit(targetUserId, amount, 'ADJUSTMENT')
        return response.ok({
          message: `Credited ${amount} coins`,
          userId: targetUserId,
          balance: res.balance,
          alreadyCredited: res.alreadyCredited ?? false, // always false here (no refId), but included for consistency
        })
      } else {
        // debit (amount < 0)
        const res = await WalletService.debit(targetUserId, Math.abs(amount), 'ADJUSTMENT')
        return response.ok({
          message: `Debited ${Math.abs(amount)} coins`,
          userId: targetUserId,
          balance: res.balance,
        })
      }
    } catch (err: any) {
      // Map common errors to 4xx
      const msg = String(err?.message ?? 'Unable to adjust balance')
      if (msg.toLowerCase().includes('insufficient')) {
        return response.badRequest({ message: 'Insufficient balance' })
      }
      return response.badRequest({ message: msg })
    }
  }
}
