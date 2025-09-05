import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  // GET /users
  async index({}: HttpContext) {
    const users = await User.query().select(['id', 'fullName', 'email'])
    return users
  }

  // GET /users/:id
  async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ message: 'User not found' })
    return { id: user.id, fullName: user.fullName, email: user.email }
  }

  // POST /users
  async store({ request, response }: HttpContext) {
    const payload = request.only(['fullName', 'email', 'password'])
    if (!payload.fullName || !payload.email || !payload.password) {
      return response.badRequest({ message: 'fullName, email, password required' })
    }
    const user = await User.create(payload) // password is accepted, hashed by hook
    return response.created({ id: user.id, fullName: user.fullName, email: user.email })
  }

  // PUT /users/:id
  async update({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ message: 'User not found' })

    const { fullName, email, password } = request.only(['fullName', 'email', 'password'])
    if (fullName !== undefined) user.fullName = fullName
    if (email !== undefined) user.email = email
    if (password !== undefined) user.password = password // triggers re-hash

    await user.save()
    return { id: user.id, fullName: user.fullName, email: user.email }
  }

  // DELETE /users/:id
  async destroy({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ message: 'User not found' })
    await user.delete()
    return response.noContent()
  }
}
