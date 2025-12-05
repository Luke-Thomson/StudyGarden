import db from '@adonisjs/lucid/services/db'
import UserGardenPlot from '#models/user_garden_plot'

const GARDEN_SIZE = 5
export default class GardenService {
  static SIZE = GARDEN_SIZE

  static async ensureGarden(userId: number) {
    // Count how many garden plots the user already has
    const result = await UserGardenPlot
      .query()
      .where('user_id', userId)
      .count('* as total')

    const total = Number(result[0].$extras.total)

    // If user already has all 25 plots, nothing to do
    if (total === GARDEN_SIZE*GARDEN_SIZE) return

    // Otherwise, recreate the 5×5 garden
    await db.transaction(async (trx) => {
      await UserGardenPlot.query({ client: trx }).where('user_id', userId).delete()

      const plots = []
      for (let r = 0; r < GARDEN_SIZE; r++)
        for (let c = 0; c < GARDEN_SIZE; c++)
          plots.push({ userId, row: r, col: c, currentPlantId: null })

      await UserGardenPlot.createMany(plots, { client: trx })
    })
  }

  static async getGrid(userId: number) {
    const plots = await UserGardenPlot.query()
      .where('user_id', userId)
      .orderBy('row', 'asc')
      .orderBy('col', 'asc')
      .preload('currentPlant', (q) => q.preload('item'))

    // Build 5x5 grid
    const grid: any[][] = Array.from({ length: GARDEN_SIZE }, () =>
      Array(GARDEN_SIZE).fill(null)
    )

    for (const p of plots) {
      const r = p.row
      const c = p.col
      if (p.currentPlantId && p.currentPlant) {
        grid[r][c] = {
          plotId: p.id,
          plantId: p.currentPlantId,
          item: {
            id: p.currentPlant.itemId,
            name: p.currentPlant.item.name,
            slug: p.currentPlant.item.slug,
          },
          status: p.currentPlant.status,
          stage: p.currentPlant.stage,
          plantedAt: p.currentPlant.plantedAt?.toISO(),
        }
      } else {
        grid[r][c] = null
      }
    }

    return grid
  }
}
