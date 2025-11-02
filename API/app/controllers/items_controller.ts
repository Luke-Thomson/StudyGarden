import type { HttpContext } from '@adonisjs/core/http'
import Item from '#models/item'
import ItemPolicy from '#policies/item_policy'
import { itemStoreValidator } from '#validators/item_store'
import { itemUpdateValidator } from '#validators/item_update'

export default class ItemsController {
  async index({ bouncer }: HttpContext) {
    await bouncer.with(ItemPolicy).authorize('index')
    return Item.query().orderBy('name', 'asc');
  }

  async show({ params, response, bouncer }: HttpContext) {
    const item = await Item.find(params.id)
    if (!item) {
      return response.notFound({ message: 'Item not found' })
    }

    await bouncer.with(ItemPolicy).authorize('view', item)
    return item
  }

  async store({ request, response, bouncer }: HttpContext) {
    await bouncer.with(ItemPolicy).authorize('create')
    const payload = await request.validateUsing(itemStoreValidator)

    try {
      const item = await Item.create(payload)
      return response.created(item)
    } catch (error: any) {
      const message = String(error?.message ?? '').toLowerCase()
      if (message.includes('unique') || message.includes('constraint')) {
        return response.conflict({ message: 'Slug already in use' })
      }
      throw error
    }
  }

  async update({ params, request, response, bouncer }: HttpContext) {
    const item = await Item.find(params.id)
    if (!item) {
      return response.notFound({ message: 'Item not found' })
    }

    await bouncer.with(ItemPolicy).authorize('update')
    const payload = await request.validateUsing(itemUpdateValidator)
    item.merge(payload)
    await item.save()

    return item
  }

  async destroy({ params, response, bouncer }: HttpContext) {
    const item = await Item.find(params.id)
    if (!item) {
      return response.notFound({ message: 'Item not found' })
    }

    await bouncer.with(ItemPolicy).authorize('delete')
    await item.delete()
    return response.noContent()
  }
}
