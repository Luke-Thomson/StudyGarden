import Item from '#models/item'
import { LedgerType } from '#models/coin_ledger'
import WalletService from '#services/wallet_service'
import InventoryService from '#services/inventory_service'
import db from "@adonisjs/lucid/services/db";

type PurchaseInput = { itemId: number; quantity?: number } | { slug: string; quantity?: number }

export default class PurchaseService {
  private static async resolve(input: PurchaseInput) {
    const item =
      'itemId' in input
        ? await Item.findOrFail(input.itemId)
        : await Item.query().where('slug', input.slug).firstOrFail()

    const unitPrice = Number(item.price)
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error('Item has no valid price')
    }
    return { item, unitPrice }
  }

  static async purchase(userId: number, input: PurchaseInput, ledgerType: LedgerType = 'PURCHASE') {
    const qty = Math.max(1, Math.floor(input.quantity ?? 1))
    const { item, unitPrice } = await this.resolve(input)
    const totalPrice = unitPrice * qty

    return db.transaction(async (trx) => {
      // 1) Add inventory
      const inv = await InventoryService.adjustQuantity(userId, item.id, qty, undefined, trx) // no metadata

      // 2) Debit wallet (no refId, avoids UNIQUE(user_id,type,ref_id) collisions)
      const { balance } = await WalletService.debit(userId, totalPrice, ledgerType, undefined, trx)

      return {
        itemId: item.id,
        quantity: qty,
        unitPrice,
        totalPrice,
        balance,
        inventoryQuantity: inv.quantity,
      }
    })
  }

  static purchaseByItemId(
    userId: number,
    itemId: number,
    quantity = 1,
    ledgerType: LedgerType = 'PURCHASE'
  ) {
    return this.purchase(userId, { itemId, quantity }, ledgerType)
  }

  static purchaseBySlug(
    userId: number,
    slug: string,
    quantity = 1,
    ledgerType: LedgerType = 'PURCHASE'
  ) {
    return this.purchase(userId, { slug, quantity }, ledgerType)
  }
}
