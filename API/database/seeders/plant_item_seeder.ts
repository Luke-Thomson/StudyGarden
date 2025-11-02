// database/seeders/01_item_seeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Item from '#models/item'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')     // non-alphanumeric → dash
    .replace(/^-+|-+$/g, '')         // trim dashes
}

export default class ItemSeeder extends BaseSeeder {
  public static environment = ['development', 'testing', 'production']

  public async run () {
    const plants = [
      { name: "Tomato", description: "Not pronounced like its cousin, the potato, this plant is perfect for those with a speech impediment.", pack: "Common", stages: 2, growth: 5, cpd: 2, yield: 10, price: 10, pull: 0.08 },
      { name: "Cabbage", description: "One boiled cabbage please!", pack: "Common", stages: 2, growth: 6, cpd: 2, yield: 12, price: 10, pull: 0.08 },
      { name: "Carrot", description: "Snowmen love me :)", pack: "Common", stages: 2, growth: 4, cpd: 2, yield: 8, price: 10, pull: 0.08 },
      { name: "Cucumber", description: "I hardly know her...", pack: "Common", stages: 2, growth: 6, cpd: 2, yield: 12, price: 10, pull: 0.08 },
      { name: "Bell Pepper", description: "We all agree the yellow ones are the best, right?", pack: "Common", stages: 2, growth: 7, cpd: 2, yield: 14, price: 10, pull: 0.08 },
      { name: "Kale", description: "If only we could absorb vitamin C and K virtually. Doctors highly recommend this game.", pack: "Uncommon", stages: 2, growth: 4, cpd: 2.8, yield: 11, price: 20, pull: 0.06 },
      { name: "Basil", description: "Smells like summer, tastes like Italy, and looks like spinach.", pack: "Uncommon", stages: 2, growth: 3, cpd: 2.8, yield: 8, price: 20, pull: 0.06 },
      { name: "Cauliflower", description: "Albino broccoli with a bit less flavor.", pack: "Uncommon", stages: 2, growth: 8, cpd: 2.8, yield: 22, price: 20, pull: 0.06 },
      { name: "Cilantro", description: "Soap! Or an elite garnish.", pack: "Uncommon", stages: 2, growth: 3, cpd: 2.8, yield: 8, price: 20, pull: 0.06 },
      { name: "Broccoli", description: "Parents say it's good for you. Buy this plant if you believe them.", pack: "Uncommon", stages: 2, growth: 8, cpd: 2.8, yield: 22, price: 20, pull: 0.06 },
      { name: "Brussels Sprouts", description: "Great roasted, terrible boiled.", pack: "Rare", stages: 3, growth: 12, cpd: 3.6, yield: 43, price: 50, pull: 0.03 },
      { name: "Artichoke", description: "Looks like it has a big heart (doesn't).", pack: "Rare", stages: 3, growth: 13, cpd: 3.6, yield: 47, price: 50, pull: 0.03 },
      { name: "Asparagus", description: "The name's Asparagus. My friends call me Gus.", pack: "Rare", stages: 3, growth: 14, cpd: 3.6, yield: 50, price: 50, pull: 0.03 },
      { name: "Celery", description: "Crunchy water. Does log work as a side gig.", pack: "Rare", stages: 3, growth: 9, cpd: 3.6, yield: 32, price: 50, pull: 0.03 },
      { name: "Eggplant", description: "Big, beautiful, purple monster.", pack: "Rare", stages: 3, growth: 10, cpd: 3.6, yield: 36, price: 50, pull: 0.03 },
      { name: "Strawberry", description: "Not shaped like a straw or a berry, a real head-scratcher.", pack: "Advanced", stages: 3, growth: 8, cpd: 4.2, yield: 34, price: 75, pull: 0.02 },
      { name: "Blueberry", description: "Great for muffins, a second-class citizen in pancake-ville.", pack: "Advanced", stages: 3, growth: 12, cpd: 4.2, yield: 50, price: 75, pull: 0.02 },
      { name: "Pineapple", description: "Home to a tiny yellow sponge in the Pacific Ocean.", pack: "Advanced", stages: 3, growth: 15, cpd: 4.2, yield: 63, price: 75, pull: 0.02 },
      { name: "Watermelon", description: "Watermelon eating contesting coming in Study Garden 2.0", pack: "Advanced", stages: 3, growth: 13, cpd: 4.2, yield: 55, price: 75, pull: 0.02 },
      { name: "Pumpkin", description: "Fall decor and an occasional carriage.", pack: "Advanced", stages: 3, growth: 12, cpd: 4.2, yield: 50, price: 75, pull: 0.02 },
      { name: "Chamomile", description: "Shoutout to sleepy time tea.", pack: "Specialty", stages: 3, growth: 6, cpd: 4.8, yield: 29, price: 150, pull: 0.01 },
      { name: "Lavender", description: "Small, beautiful, purple monster.", pack: "Specialty", stages: 3, growth: 8, cpd: 4.8, yield: 38, price: 150, pull: 0.01 },
      { name: "Rosemary", description: "Give me a Rose! (Rose!) Give me a Mary (MARY!!) Give me another Mary! What does that spell? Wait.", pack: "Specialty", stages: 3, growth: 9, cpd: 4.8, yield: 43, price: 150, pull: 0.01 },
      { name: "Peppermint", description: "A true garden colonizer. Thankfully such realism does not affect your garden here!", pack: "Specialty", stages: 3, growth: 5, cpd: 4.8, yield: 24, price: 150, pull: 0.01 },
      { name: "Venus Fly Trap", description: "Women love me, flies fear me.", pack: "Specialty", stages: 3, growth: 14, cpd: 4.8, yield: 67, price: 150, pull: 0.01 },
    ]

    const payloads = plants.map((p) => ({
      slug: slugify(p.name),
      name: p.name,
      type: 'seed',
      description: p.description,
      metadata: {
        packName: p.pack,
        stageCount: p.stages,
        growthDays: p.growth,
        coinsPerDay: p.cpd,
        coinYield: p.yield,
        repurchasePrice: p.price,
        mysteryPackPullPct: p.pull,
      },
    }))

    await Item.updateOrCreateMany('slug', payloads)
    console.log(`Seeded ${payloads.length} plants`)
  }
}
