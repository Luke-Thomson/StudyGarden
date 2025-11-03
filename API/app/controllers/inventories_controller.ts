import type { HttpContext } from '@adonisjs/core/http'
import InventoryService from '#services/inventory_service'
import { inventoryAdjustValidator } from '#validators/inventory_adjust'

export default class InventoryController {
  async mine({ auth }: HttpContext) {
    const user = await auth.authenticate()
    return InventoryService.listForUser(user.id)
  }

  async forUser({ params }: HttpContext) {
    const userId = Number(params.id)
    return await InventoryService.listForUser(userId)
  }

  async adjust({ auth, request, response }: HttpContext) {
    const admin = await auth.authenticate()
    const { userId, itemId, quantityChange, metadata } = await request.validateUsing(
      inventoryAdjustValidator
    )

    const targetUserId = userId ?? admin.id

    try {
      const result = await InventoryService.adjustQuantity(
        targetUserId,
        itemId,
        quantityChange,
        metadata
      )

      return response.ok({
        message: 'Inventory updated',
        ...result,
      })
    } catch (error: any) {
      const message = String(error?.message ?? 'Unable to update inventory')
      return response.badRequest({ message })
    }
  }
}
