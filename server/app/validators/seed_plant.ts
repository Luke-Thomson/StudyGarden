import vine from '@vinejs/vine'
import GardenService from "#services/garden_service";

export const seedPlantValidator = vine.compile(
  vine.object({
    row: vine.number().withoutDecimals().min(0).max(GardenService.SIZE -1),
    col: vine.number().withoutDecimals().min(0).max(GardenService.SIZE - 1),
    seedSlug: vine.string().trim(),
  })
)
