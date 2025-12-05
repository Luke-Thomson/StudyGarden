import { DateTime } from 'luxon'
import {BaseModel, belongsTo, column} from '@adonisjs/lucid/orm'
import UserPlant from "#models/user_plant";
import * as relations from '@adonisjs/lucid/types/relations'

export default class UserGardenPlot extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare row: number

  @column()
  declare col: number

  @column()
  declare currentPlantId: number | null

  @belongsTo(() => UserPlant, {
    foreignKey: 'currentPlantId',
  })
  declare currentPlant: relations.BelongsTo<typeof UserPlant>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
