import type { HttpContext } from '@adonisjs/core/http'
import GardenService from '#services/garden_service'
import PlotService from '#services/plot_service'
import {seedPlantValidator} from "#validators/seed_plant";
import {plantHarvestValidator} from "#validators/plant_harvest";
export default class GardensController {
  // GET /garden
  async show({ auth }: HttpContext) {
    const userId = auth.user!.id
    await GardenService.ensureGarden(userId)
    const grid = await GardenService.getGrid(userId)
    return { grid }
  }

  // POST /garden/plant
  async plant({ auth, request, response }: HttpContext) {
    const userId = auth.user!.id
    await GardenService.ensureGarden(userId)
    const payload = await request.validateUsing(seedPlantValidator)

    try {
      const result = await PlotService.plant(
        userId,
        payload.row,
        payload.col,
        payload.seedSlug
      )
      return response.ok(result)
    } catch (e: any) {
      return response.badRequest({ message: e?.message || 'Plant failed' })
    }
  }

  // POST /garden/harvest
  async harvest({ auth, request, response }: HttpContext) {
    const userId = auth.user!.id
    await GardenService.ensureGarden(userId)
    const payload = await request.validateUsing(plantHarvestValidator)

    try {
      const result = await PlotService.harvest(userId, payload.row, payload.col)
      return response.ok(result)
    } catch (e: any) {
      return response.badRequest({ message: e?.message || 'Harvest failed' })
    }
  }
}
