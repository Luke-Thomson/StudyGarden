import type { HttpContext } from '@adonisjs/core/http'
import WalletService from '#services/wallet_service'
import CoinLedger from '#models/coin_ledger'


export default class WalletsController {
  /**
   * GET /me/wallet
   * Returns the user's current coin balance and today's earned total.
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
}
