import { DateTime } from 'luxon'
import {BaseModel, belongsTo, column, computed} from '@adonisjs/lucid/orm'
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

  @computed()
  get currentStage() {
    if (this.status !== 'PLANTED') return 0
    if (!this.plantedAt) return 0
    if (!this.item) return 0

    const transitions = Number(this.item.metadata?.stageCount ?? 1)
    const growthDays = Number(this.item.metadata?.growthDays ?? 0)

    // Need at least 1 transition and some positive growth time
    if (transitions <= 0 || growthDays <= 0) return 0

    // visualStages = seed (0) + each transition
    const visualStages = transitions + 1

    // how many days since planting
    const now = DateTime.utc()
    const daysPassed = now.diff(this.plantedAt, 'days').days
    if (daysPassed <= 0) return 0

    // weights for uneven growth:
    // stage 0 gets weight 1, stage 1 gets 2, ..., last gets visualStages
    const weights = Array.from({ length: visualStages }, (_, i) => i + 1)
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    const daysPerWeight = growthDays / totalWeight

    let cumulative = 0
    for (let stage = 0; stage < visualStages; stage++) {
      cumulative += weights[stage] * daysPerWeight
      if (daysPassed < cumulative) {
        return stage
      }
    }

    // fully grown
    return visualStages - 1
  }

}
