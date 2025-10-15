import { DateTime } from 'luxon'
import {BaseModel, belongsTo, column} from '@adonisjs/lucid/orm'
import User from "#models/user";
import Subject from '#models/subject'
import * as relations from "@adonisjs/lucid/types/relations";


export type TimerMode = 'STUDY' | 'BREAK_SHORT' | 'BREAK_LONG'
export type TimerStatus = 'RUNNING' | 'COMPLETED' | 'ABANDONED'

export default class TimerSession extends BaseModel {
  @column({isPrimary: true})
  declare id: number

  @column()
  declare userId: number
  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  @column()
  declare mode: TimerMode

  @column()
  declare expectedDurationSec: number

  @column()
  declare status: TimerStatus

  @column.dateTime()
  declare startedAt: DateTime

  @column.dateTime()
  declare endedAt: DateTime | null

  @column.dateTime({autoCreate: true})
  declare createdAt: DateTime

  @column.dateTime({autoCreate: true, autoUpdate: true})
  declare updatedAt: DateTime

  @column()
  declare subjectId: number | null
  @belongsTo(() => Subject)
  declare subject: relations.BelongsTo<typeof Subject>
}
