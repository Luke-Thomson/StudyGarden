import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'timer_sessions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('subject_id')
        .unsigned()
        .references('id')
        .inTable('subjects')
        .onDelete('SET NULL')
        .index()
        .nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('subject_id')
    })
  }
}
