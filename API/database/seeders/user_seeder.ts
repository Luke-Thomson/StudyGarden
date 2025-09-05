import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      { fullName: 'virk',  email: 'virk@example.com',  password: 'secret123' },
      { fullName: 'romain', email: 'romain@example.com', password: 'secret123' },
    ])
  }
}
