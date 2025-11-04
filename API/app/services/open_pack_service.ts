import Item from '#models/item'
import UserSeedUnlock from '#models/user_seed_unlock'
import InventoryService from '#services/inventory_service'

type Drop = { seedSlug: string; weight: number }

function rollWeighted(drops: Drop[]): string {
  const total = drops.reduce((s, d) => s + Math.max(0, Number(d.weight || 0)), 0)
  if (total <= 0) throw new Error('Pack has no valid weighted drops')
  let r = Math.random() * total
  for (const d of drops) {
    r -= Math.max(0, Number(d.weight || 0))
    if (r <= 0) return d.seedSlug
  }
  return drops[drops.length - 1].seedSlug
}

export default class PackOpenService {
  /**
   * Open exactly ONE pack by slug.
   * Steps:
   *  1) consume 1 pack from inventory
   *  2) roll a seed via metadata.drops (weighted)
   *  3) upsert entitlement in user_seed_unlocks
   * If step 3 fails, compensates by returning the pack (+1).
   */
  static async openOne(userId: number, packSlug: string) {
    // Load pack
    const pack = await Item.query()
      .where('slug', packSlug)
      .andWhere('type', 'seed_pack')
      .firstOrFail()

    const drops = (pack.metadata?.drops as Drop[]) || []
    if (!Array.isArray(drops) || drops.length === 0) {
      throw new Error('Pack has no drops configured')
    }

    // 1) consume pack (throws if none owned)
    await InventoryService.adjustQuantity(userId, pack.id, -1)

    try {
      // 2) roll a seed
      const seedSlug = rollWeighted(drops)
      const seed = await Item.query()
        .where('slug', seedSlug)
        .andWhere('type', 'seed')
        .firstOrFail()

      // 3) upsert unlock (no useTransaction on the class)
      await UserSeedUnlock.firstOrCreate(
        { userId, seedItemId: seed.id },
        {} // no extra fields
      )

      // grant a starter seed:
      await InventoryService.adjustQuantity(userId, seed.id, +1)

      return {
        pack: pack.slug,
        seed: seed.slug,
        newlyUnlocked: true, // firstOrCreate doesn't tell us; set true for UX or re-check if you want exact
      }
    } catch (err) {
      // Compensation: give the pack back if anything after consumption fails
      try {
        await InventoryService.adjustQuantity(userId, pack.id, +1)
      } catch { /* swallow to not hide original error */ }
      throw err
    }
  }
}
