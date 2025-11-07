import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Item from '#models/item'

const PACKS_CSV = `Pack Name,Description,Price
Common,"Happy, household plants perfect for beginner gardeners!",25
Uncommon,"Cruciferous and hearty, this bundle brings great value to any garden.",50
Rare,"A selection of moore niche plants, for those with fine tastes. ",100
Advanced,Behold.. the berries and fruits of olde. Sweet and full of life.,200
Specialty,"In this pack you will find rare spices, herbs, and devillish plants.",400
Random Pack,Feeling lucky? This pack could hold any plant from the entire shop.,85`

const SEEDS_CSV = `Plant Name,Description,Pack Name,Stage Count,Growth time (days),Coins per day,Coin Yield,Repurchase Price,Mystery Pack Pull Percentage
Tomato,"Not pronounced like its cousin, the potato, this plant is perfect for those with a speech impediment. ",Common,2,5,2,10,10,0.08
Cabbage,One boiled cabbage please!,Common,2,6,2,12,10,0.08
Carrot,Snowmen love me :),Common,2,4,2,8,10,0.08
Cucumber,I hardly know her...,Common,2,6,2,12,10,0.08
Bell Pepper,"We all agree the yellow ones are the best, right?",Common,2,7,2,14,10,0.08
Kale,If only we could absorb vitamin C and K virtually. Doctors highly recommend this game. ,Uncommon,2,4,2.8,11,20,0.06
Basil,"Smells like summer, tastes like Italy, and looks like spinach.",Uncommon,2,3,2.8,8,20,0.06
Cauliflower,Albino broccoli with a bit less flavor.,Uncommon,2,8,2.8,22,20,0.06
Cilantro,Soap! Or an elite garnish.,Uncommon,2,3,2.8,8,20,0.06
Broccoli,Parents say it's good for you. Buy this plant if you believe them.,Uncommon,2,8,2.8,22,20,0.06
Brussels Sprouts,"Great roasted, terrible boiled.",Rare,3,12,3.6,43,50,0.03
Artichoke,Looks like it has a big heart (doesn't).,Rare,3,13,3.6,47,50,0.03
Asparagus,The name's Asparagus. My friends call me Gus.,Rare,3,14,3.6,50,50,0.03
Celery,Crunchy water. Does log work as a side gig.,Rare,3,9,3.6,32,50,0.03
Eggplant,"Big, beautiful, purple monster.",Rare,3,10,3.6,36,50,0.03
Strawberry,"Not shaped like a straw or a berry, a real head-scratcher.",Advanced,3,8,4.2,34,75,0.02
Blueberry,"Great for muffins, a second-class citizen in pancake-ville.",Advanced,3,12,4.2,50,75,0.02
Pineapple,Home to a tiny yellow sponge in the Pacific Ocean.,Advanced,3,15,4.2,63,75,0.02
Watermelon,Watermelon eating contesting coming in Study Garden 2.0,Advanced,3,13,4.2,55,75,0.02
Pumpkin,Fall decor and an occassional carriage.,Advanced,3,12,4.2,50,75,0.02
Chamomile,Shoutout to sleepy time tea.,Specialty,3,6,4.8,29,150,0.01
Lavender,"Small, beautiful, purple monster.",Specialty,3,8,4.8,38,150,0.01
Rosemary,Give me a Rose! (Rose!) Give me a Mary (MARY!!) Give me another Mary! What does that spell? Wait.,Specialty,3,9,4.8,43,150,0.01
Peppermint,A true garden colonizer. Thankfully such realism does not affect your garden here!,Specialty,3,5,4.8,24,150,0.01
Venus Fly Trap,"Women love me, flies fear me.",Specialty,3,14,4.8,67,150,0.01`

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const header = lines[0].split(',').map((h) => h.trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    // very small CSV parser for this dataset (handles quotes for simple fields)
    const line = lines[i]
    const cells: string[] = []
    let cur = ''
    let inQ = false
    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"' && (j === 0 || line[j - 1] !== '\\')) {
        inQ = !inQ
        continue
      }
      if (ch === ',' && !inQ) {
        cells.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur.trim())

    const obj: Record<string, string> = {}
    header.forEach((h, idx) => (obj[h] = (cells[idx] ?? '').replace(/^"|"$/g, '')))
    rows.push(obj)
  }
  return rows
}

function toNumberStrict(s: string): number {
  const cleaned = (s ?? '').toString().trim().replace(/[^0-9.\-]/g, '')
  const n = Number(cleaned)
  if (!Number.isFinite(n)) throw new Error(`Invalid number: "${s}"`)
  return n
}

export default class PacksAndSeedsFromCsvSeeder extends BaseSeeder {
  public static environment = ['development', 'testing', 'production']

  public async run() {
    // 1) Parse CSVs
    const packs = parseCsv(PACKS_CSV).map((r) => ({
      packName: r['Pack Name'],
      description: r['Description'],
      price: toNumberStrict(r['Price']),
    }))

    const seeds = parseCsv(SEEDS_CSV).map((r) => ({
      plantName: r['Plant Name'],
      description: r['Description'],
      packName: r['Pack Name'],
      stageCount: toNumberStrict(r['Stage Count']),
      growthDays: toNumberStrict(r['Growth time (days)']),
      coinsPerDay: Number(r['Coins per day']),
      coinYield: toNumberStrict(r['Coin Yield']),
      repurchasePrice: toNumberStrict(r['Repurchase Price']),
      pullPct: Number(r['Mystery Pack Pull Percentage']),
    }))

    // 2) Upsert all seeds as items (type='seed')
    for (const s of seeds) {
      const slug = slugify(s.plantName)
      await Item.updateOrCreate(
        { slug },
        {
          slug,
          name: s.plantName,
          type: 'seed',
          description: s.description || null,
          price: s.repurchasePrice,
          metadata: {
            packName: s.packName,
            stageCount: s.stageCount,
            growthDays: s.growthDays,
            coinsPerDay: s.coinsPerDay,
            coinYield: s.coinYield,
            mysteryPackPullPct: s.pullPct,
          },
        }
      )
    }

    // Build helpers
    const seedsByPack = new Map<string, { slug: string; pullPct: number }[]>()
    for (const s of seeds) {
      const slug = slugify(s.plantName)
      const arr = seedsByPack.get(s.packName) ?? []
      arr.push({ slug, pullPct: Number(s.pullPct) || 0 })
      seedsByPack.set(s.packName, arr)
    }
    const allSeeds = seeds.map((s) => ({ slug: slugify(s.plantName), pullPct: Number(s.pullPct) || 0 }))

// Scale a 0.08 style probability to a stable integer weight
    const SCALE = 10000
    const weightFromPct = (pct: number) => Math.max(1, Math.round(pct * SCALE))

// 3) Upsert packs as items (type='seed_pack') with weighted drops
    for (const p of packs) {
      const slug = slugify(p.packName) + (p.packName.toLowerCase().includes('pack') ? '' : '-pack')

      let drops: { seedSlug: string; weight: number }[] = []

      if (p.packName.toLowerCase() === 'random pack') {
        // All seeds, weighted by their global pull %
        drops = allSeeds
          .map((s) => ({ seedSlug: s.slug, weight: weightFromPct(s.pullPct) }))
          .filter((d) => d.weight > 0)
      } else {
        // Only seeds in this pack, also weighted by their pull %
        const grouped = seedsByPack.get(p.packName) || []
        drops = grouped
          .map((s) => ({ seedSlug: s.slug, weight: weightFromPct(s.pullPct) }))
          .filter((d) => d.weight > 0)
      }

      // Safety: if all weights collapse to 0 somehow, fall back to equal weights
      if (drops.length && drops.every((d) => d.weight === 0)) {
        drops = drops.map((d) => ({ ...d, weight: 1 }))
      }

      await Item.updateOrCreate(
        { slug },
        {
          slug,
          name: p.packName,
          type: 'seed_pack',
          description: p.description || null,
          price: p.price,
          metadata: {
            drops,
          },
        }
      )
    }


    console.log(`Seeded/updated ${seeds.length} seeds and ${packs.length} packs`)
  }
}
