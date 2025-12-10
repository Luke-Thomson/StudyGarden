import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_plants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('plot_id').unsigned().nullable().index()
      table.integer('item_id').unsigned().notNullable().index()
      table.string('status').notNullable().defaultTo('PLANTED')
      table.integer('stage').unsigned().notNullable().defaultTo(0)

      table.timestamp('planted_at').notNullable()
      table.timestamp('harvested_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
