import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'timer_sessions'

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

      table.enum('mode', ['STUDY', 'BREAK_SHORT', 'BREAK_LONG']).notNullable()
      table.integer('expected_duration_sec').notNullable()
      table
        .enum('status', ['RUNNING', 'COMPLETED', 'ABANDONED'])
        .notNullable()
        .defaultTo('RUNNING')

      table.timestamp('started_at').notNullable()
      table.timestamp('ended_at')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
