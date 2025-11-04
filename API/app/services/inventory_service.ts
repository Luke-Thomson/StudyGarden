import db from '@adonisjs/lucid/services/db'
import Item, { type ItemMetadata } from '#models/item'
import UserInventoryItem from '#models/user_inventory_item'

export default class InventoryService {
  static async listForUser(userId: number) {
    return UserInventoryItem.query().where('user_id', userId).preload('item').orderBy('id', 'asc')
  }

  static async adjustQuantity(
    userId: number,
    itemId: number,
    quantityChange: number,
    metadata?: ItemMetadata | null
  ) {
    if (quantityChange === 0) {
      throw new Error('quantityChange must be non-zero')
    }

    return db.transaction(async (trx) => {
      await Item.query({ client: trx }).where('id', itemId).firstOrFail()

      const existing = await UserInventoryItem.query({ client: trx })
        .where('user_id', userId)
        .andWhere('item_id', itemId)
        .forUpdate()
        .first()

      if (existing) {
        const updatedQuantity = existing.quantity + quantityChange
        if (updatedQuantity < 0) {
          throw new Error('Insufficient quantity to remove')
        }

        existing.quantity = updatedQuantity
        if (metadata !== undefined) {
          existing.metadata = metadata
        }

        if (updatedQuantity === 0) {
          await existing.useTransaction(trx).delete()
          return {
            userId,
            itemId,
            quantity: 0,
            metadata: metadata ?? existing.metadata ?? null,
          }
        }

        await existing.useTransaction(trx).save()
        return {
          userId,
          itemId,
          quantity: existing.quantity,
          metadata: existing.metadata,
        }
      }

      if (quantityChange < 0) {
        throw new Error('Cannot remove items that are not in inventory')
      }

      const inventoryItem = new UserInventoryItem()
      inventoryItem.userId = userId
      inventoryItem.itemId = itemId
      inventoryItem.quantity = quantityChange
      inventoryItem.metadata = metadata ?? null
      await inventoryItem.useTransaction(trx).save()

      return {
        userId,
        itemId,
        quantity: inventoryItem.quantity,
        metadata: inventoryItem.metadata,
      }
    })
  }
}
