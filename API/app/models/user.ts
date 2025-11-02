import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import {BaseModel, column, hasMany} from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import UserInventoryItem from '#models/user_inventory_item'
import * as relations from '@adonisjs/lucid/types/relations'

export type Role = 'admin' | 'user'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column() declare role: 'admin' | 'user'

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasMany(() => UserInventoryItem)
  declare inventoryItems: relations.HasMany<typeof UserInventoryItem>
}
