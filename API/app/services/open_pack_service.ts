// app/services/pack_open_service.ts
import db from '@adonisjs/lucid/services/db'
import Item from '#models/item'
import UserSeedUnlock from '#models/user_seed_unlock'
import InventoryService from '#services/inventory_service'

type Drop = { seedSlug: string; weight: number }

function sanitizeDrops(raw: unknown): Drop[] {
  if (!Array.isArray(raw)) return []
  const map = new Map<string, number>()
  for (const e of raw as Drop[]) {
    const slug = typeof e?.seedSlug === 'string' ? e.seedSlug.trim() : ''
    const w = Number((e as Drop)?.weight)
    if (!slug || !Number.isFinite(w) || w <= 0) continue
    map.set(slug, (map.get(slug) ?? 0) + w)
  }
  return Array.from(map, ([seedSlug, weight]) => ({ seedSlug, weight }))
}

function rollWeighted(drops: Drop[]): string {
  const total = drops.reduce((sum, d) => sum + d.weight, 0)
  if (total <= 0) throw new Error('Pack has no valid weighted drops')
  let r = Math.random() * total
  for (const d of drops) {
    r -= d.weight
    if (r <= 0) return d.seedSlug
  }
  return drops[drops.length - 1].seedSlug
}

export default class PackOpenService {
  /**
   * Open exactly ONE pack by slug (atomic).
   * Steps (inside a single DB transaction):
   *  1) consume 1 pack from inventory
   *  2) roll a seed via weighted drops
   *  3) upsert entitlement in user_seed_unlocks
   * Optional: grant a starter seed unit (commented)
   */
  static async openOne(userId: number, packSlug: string) {
    // --- Load pack & validate drops BEFORE starting trx (no locks yet)
    const pack = await Item.query()
      .where('slug', packSlug)
      .andWhere('type', 'seed_pack')
      .firstOrFail()

    const drops = sanitizeDrops(pack.metadata?.drops)
    if (drops.length === 0) throw new Error('Pack has no valid drops configured')

    // Resolve all seed items referenced by the pack; verify none missing
    const dropSlugs = drops.map((d) => d.seedSlug)
    const seeds = await Item.query()
      .whereIn('slug', dropSlugs)
      .andWhere('type', 'seed')

    const found = new Set(seeds.map((s) => s.slug))
    const missing = dropSlugs.filter((slug) => !found.has(slug))
    if (missing.length) {
      throw new Error(`Pack references unknown seeds: ${missing.join(', ')}`)
    }

    // --- Atomic section
    return await db.transaction(async (trx) => {
      // 1) consume the pack (will throw if insufficient)
      // adjustQuantity signature assumed: (userId, itemId, quantityChange, metadata?, trx?)
      await InventoryService.adjustQuantity(userId, pack.id, -1, undefined, trx)

      // 2) roll & resolve the seed (from the already-fetched list)
      const rolledSlug = rollWeighted(drops)
      const seed = seeds.find((s) => s.slug === rolledSlug)!
      if (!seed) throw new Error(`Rolled seed "${rolledSlug}" not found`)

      // 3) upsert unlock (idempotent)
      const existed = await UserSeedUnlock.query({ client: trx })
        .where('user_id', userId)
        .andWhere('seed_item_id', seed.id)
        .first()

      if (!existed) {
        await UserSeedUnlock.create({ userId, seedItemId: seed.id }, { client: trx })
      }

      await InventoryService.adjustQuantity(userId, seed.id, +1, undefined, trx)

      return {
        pack: pack.slug,
        seed: seed.slug,
        newlyUnlocked: !existed,
      }
    })
  }
}

