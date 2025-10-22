import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coin_ledgers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.bigInteger('amount').notNullable() // positive = credit, negative = debit
      table.enum('type', ['SESSION_CREDIT', 'PURCHASE', 'ADJUSTMENT', 'REFUND']).notNullable()
      table.integer('ref_id').unsigned().nullable() // e.g., timer_session.id or seed_pack.id
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.unique(['user_id', 'type', 'ref_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
