import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_inventory_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('item_id')
        .unsigned()
        .references('id')
        .inTable('items')
        .onDelete('CASCADE')
        .notNullable()

      table.integer('quantity').notNullable().defaultTo(0)
      table.json('metadata').nullable()

      table.unique(['user_id', 'item_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
