import { DateTime } from 'luxon'
import {BaseModel, belongsTo, column} from '@adonisjs/lucid/orm'
import Item from "#models/item";
import * as relations from '@adonisjs/lucid/types/relations'
import UserGardenPlot from "#models/user_garden_plot";

export type PlantStatus = 'PLANTED' | 'HARVESTED'

export default class UserPlant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare plotId: number | null

  @column()
  declare itemId: number

  @column()
  declare status: PlantStatus

  @column()
  declare stage: number

  @column.dateTime()
  declare plantedAt: DateTime

  @column.dateTime()
  declare harvestedAt: DateTime | null

  @belongsTo(() => Item)
  declare item: relations.BelongsTo<typeof Item>

  @belongsTo(() => UserGardenPlot, {
    foreignKey: 'plotId',
  })
  declare plot: relations.BelongsTo<typeof UserGardenPlot>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
