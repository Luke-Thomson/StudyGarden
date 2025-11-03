import Item from '#models/item'
import { LedgerType } from '#models/coin_ledger'
import WalletService from '#services/wallet_service'
import InventoryService from '#services/inventory_service'
import { ItemMetadata } from '#models/item'

type PurchaseInput = { itemId: number; quantity?: number } | { slug: string; quantity?: number }

export default class PurchaseService {
  private static async resolve(itemRef: PurchaseInput) {
    let item: Item
    if ('itemId' in itemRef) item = await Item.findOrFail(itemRef.itemId)
    else item = await Item.query().where('slug', itemRef.slug).firstOrFail()

    const unitPrice = Number((item.metadata as ItemMetadata | null)?.repurchasePrice ?? NaN)
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error('Item has no valid repurchasePrice')
    }
    return { item, unitPrice }
  }

  static async purchase(userId: number, input: PurchaseInput, ledgerType: LedgerType = 'PURCHASE') {
    const qty = Math.max(1, Math.floor(input.quantity ?? 1))
    const { item, unitPrice } = await this.resolve(input)
    const totalPrice = unitPrice * qty

    // 1) Add inventory
    const inv = await InventoryService.adjustQuantity(userId, item.id, qty) // no metadata

    // 2) Debit wallet (no refId, avoids UNIQUE(user_id,type,ref_id) collisions)
    try {
      const { balance } = await WalletService.debit(userId, totalPrice, ledgerType)
      return { itemId: item.id, quantity: qty, unitPrice, totalPrice, balance, inventoryQuantity: inv.quantity }
    } catch (e) {
      // compensate inventory on debit failure
      try { await InventoryService.adjustQuantity(userId, item.id, -qty) } catch {}
      throw e
    }
  }

  static purchaseByItemId(userId: number, itemId: number, quantity = 1, ledgerType: LedgerType = 'PURCHASE') {
    return this.purchase(userId, { itemId, quantity }, ledgerType)
  }

  static purchaseBySlug(userId: number, slug: string, quantity = 1, ledgerType: LedgerType = 'PURCHASE') {
    return this.purchase(userId, { slug, quantity }, ledgerType)
  }
}

