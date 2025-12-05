import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import UserGardenPlot from '#models/user_garden_plot'
import UserPlant from '#models/user_plant'
import Item from '#models/item'
import UserSeedUnlock from '#models/user_seed_unlock'
import InventoryService from '#services/inventory_service'
import WalletService from "#services/wallet_service";

const GARDEN_SIZE = 5

export default class PlotService {
  static async plant(userId: number, row: number, col: number, seedSlug: string) {
    if (row < 0 || row >= GARDEN_SIZE || col < 0 || col >= GARDEN_SIZE) {
      throw new Error('Plot out of bounds')
    }

    return db.transaction(async (trx) => {
      const plot = await UserGardenPlot.query({ client: trx })
        .where({ userId, row, col })
        .forUpdate()
        .firstOrFail()

      if (plot.currentPlantId) {
        throw new Error('Plot already occupied')
      }

      const seed = await Item.query({ client: trx })
        .where('slug', seedSlug)
        .andWhere('type', 'seed')
        .firstOrFail()

      // require unlock
      const unlocked = await UserSeedUnlock.query({ client: trx })
        .where({ userId, seedItemId: seed.id })
        .first()

      if (!unlocked) {
        throw new Error('Seed not unlocked')
      }

      // consume 1 seed from inventory
      await InventoryService.adjustQuantity(userId, seed.id, -1, null, trx)

      // create plant
      const plant = await UserPlant.create(
        {
          userId,
          plotId: plot.id,
          itemId: seed.id,
          status: 'PLANTED',
          stage: 0,
          plantedAt: DateTime.utc(),
          harvestedAt: null,
        },
        { client: trx }
      )

      plot.currentPlantId = plant.id
      await plot.useTransaction(trx).save()

      return {
        plotId: plot.id,
        plantId: plant.id,
      }
    })
  }

  static async harvest(userId: number, row: number, col: number) {
    if (row < 0 || row >= GARDEN_SIZE || col < 0 || col >= GARDEN_SIZE) {
      throw new Error('Plot out of bounds')
    }

    // All garden changes inside ONE transaction
    const { reward, plantId } = await db.transaction(async (trx) => {
      const plot = await UserGardenPlot.query({ client: trx })
        .where({ userId, row, col })
        .forUpdate()
        .firstOrFail()

      if (!plot.currentPlantId) {
        throw new Error('Plot is empty')
      }

      const plant = await UserPlant.query({ client: trx })
        .where('id', plot.currentPlantId)
        .forUpdate()
        .firstOrFail()

      // Load the item to get the reward value
      const seedItem = await Item.query({ client: trx })
        .where('id', plant.itemId)
        .firstOrFail()

      const reward = Number(seedItem.metadata?.coinYield ?? seedItem.price)

      // mark plant harvested + free plot
      plant.status = 'HARVESTED'
      plant.plotId = null
      plant.harvestedAt = DateTime.utc()
      await plant.useTransaction(trx).save()

      plot.currentPlantId = null
      await plot.useTransaction(trx).save()

      return { reward: Number.isFinite(reward) ? reward : 0, plantId: plant.id }
    })

    // 2) AFTER the transaction, credit the wallet (separate transaction inside WalletService)
    if (reward > 0) {
      await WalletService.credit(userId, reward, 'ADJUSTMENT', plantId)
    }

    return {
      harvestedPlantId: plantId,
      coinsAwarded: reward,
    }
  }
}

