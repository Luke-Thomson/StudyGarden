import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'


export type LedgerType = 'SESSION_CREDIT' | 'PURCHASE' | 'ADJUSTMENT' | 'REFUND'

export default class CoinLedger extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare amount: number

  @column()
  declare type: LedgerType

  @column()
  declare refId?: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
