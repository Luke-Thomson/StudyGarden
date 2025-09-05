import { DateTime } from 'luxon'
import {BaseModel, belongsTo, column} from '@adonisjs/lucid/orm'
import User from "#models/user";
import * as relations from "@adonisjs/lucid/types/relations";

export default class Subject extends BaseModel {
  @column({isPrimary: true})
  declare id: number

  @column() declare userId: number

  @column() declare title: string

  @column.dateTime({autoCreate: true})
  declare createdAt: DateTime

  @column.dateTime({autoCreate: true, autoUpdate: true})
  declare updatedAt: DateTime

  @belongsTo(() => User) declare user: relations.BelongsTo<typeof User>
}
