async function deAgePlant(userId, plotId, daysToDeAge) {
  const { default: UserGardenPlot } = await import('#models/user_garden_plot')
  const { default: UserPlant } = await import('#models/user_plant')
  const { DateTime } = await import('luxon')

  if (!Number.isFinite(userId) || !Number.isFinite(plotId) || !Number.isFinite(daysToDeAge)) {
    console.log('Invalid arguments. Usage: deAgePlant(userId, plotId, daysToDeAge)')
    return
  }

  const plot = await UserGardenPlot
    .query()
    .where({ userId, id: plotId })
    .preload('currentPlant', (q) => q.preload('item'))
    .first()

  if (!plot) {
    console.log(`No plot found for user ${userId} with plotId ${plotId}`)
    return
  }

  if (!plot.currentPlant) {
    console.log(`Plot ${plotId} has no plant`)
    return
  }

  const plant = plot.currentPlant

  if (!plant.plantedAt) {
    console.log(`Plant ${plant.id} has no plantedAt; cannot de-age`)
    return
  }

  const originalPlantedAt = plant.plantedAt
  const originalStage = plant.currentStage

  let newPlantedAt = plant.plantedAt.minus({ days: daysToDeAge })
  const now = DateTime.utc()

  if (newPlantedAt > now) newPlantedAt = now

  plant.plantedAt = newPlantedAt
  await plant.save()

  const fresh = await UserPlant
    .query()
    .where('id', plant.id)
    .preload('item')
    .firstOrFail()

  console.log('--- De-age result ---')
  console.log(`User:         ${userId}`)
  console.log(`Plot ID:      ${plotId}`)
  console.log(`Plant ID:     ${fresh.id}`)
  console.log(`Was plantedAt: ${originalPlantedAt.toISO()}`)
  console.log(`Now plantedAt: ${fresh.plantedAt.toISO()}`)
  console.log(`Stage before: ${originalStage}`)
  console.log(`Stage now:    ${fresh.currentStage}`)
}

// expose function to REPL
global.deAgePlant = deAgePlant
console.log("Loaded deAgePlant(userId, plotId, days)")

