import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_garden_plots'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('row').unsigned().notNullable()
      table.integer('col').unsigned().notNullable()
      table.integer('current_plant_id').unsigned().nullable().index()

      table.unique(['user_id', 'row', 'col'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
