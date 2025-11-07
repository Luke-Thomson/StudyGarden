import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Item, { type ItemMetadata } from '#models/item'

function parseMetadata(value: any): ItemMetadata | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  if (typeof value === 'object') {
    return value as ItemMetadata
  }

  return null
}

function prepareMetadata(value: ItemMetadata | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  return JSON.stringify(value)
}

export default class UserInventoryItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare itemId: number

  @column()
  declare quantity: number

  @column({
    prepare: prepareMetadata,
    consume: parseMetadata,
    serialize: (value: ItemMetadata | null) => value,
  })
  declare metadata: ItemMetadata | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  @belongsTo(() => Item)
  declare item: relations.BelongsTo<typeof Item>
}
