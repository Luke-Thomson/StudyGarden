import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import UserInventoryItem from '#models/user_inventory_item'

export type ItemMetadata = Record<string, any>

//used when reading from the database.
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

//used when saving back to the database.
function prepareMetadata(value: ItemMetadata | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  return JSON.stringify(value)
}

export default class Item extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare name: string

  @column()
  declare type: string

  @column()
  declare description: string | null

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

  @hasMany(() => UserInventoryItem)
  declare inventoryItems: relations.HasMany<typeof UserInventoryItem>
}
