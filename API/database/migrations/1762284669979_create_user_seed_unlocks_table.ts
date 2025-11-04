import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_seed_unlocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('seed_item_id').unsigned().notNullable().index()
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      table.unique(['user_id', 'seed_item_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
