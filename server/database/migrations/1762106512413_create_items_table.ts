import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('slug', 100).notNullable().unique()
      table.string('name', 200).notNullable()
      table.string('type', 100).notNullable()
      table.text('description').nullable()
      table.json('metadata').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
