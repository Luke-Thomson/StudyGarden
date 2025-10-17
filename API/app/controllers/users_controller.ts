import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { userStoreValidator } from '#validators/user_store'
import { userUpdateValidator } from '#validators/user_update'

export default class UsersController {
  /**
   * GET /users
   * List all users (admin only)
   */
  public async index({ }: HttpContext) {
    return User.query()
  }

  /**
   * POST /users
   * Create a new user (admin only)
   */
  public async store({ request }: HttpContext) {
    const data = await request.validateUsing(userStoreValidator)
    const user = await User.create(data)
    return user
  }

  /**
   * GET /users/:id
   * Show one user
   */
  public async show({ params }: HttpContext) {
    return User.findOrFail(params.id)
  }

  /**
   * PATCH /users/:id
   * Update user email or role (admin only)
   */
  public async update({ params, request }: HttpContext) {
    const data = await request.validateUsing(userUpdateValidator)
    const user = await User.findOrFail(params.id)

    user.merge(data)
    await user.save()
    return user
  }

  /**
   * DELETE /users/:id
   * Remove user (admin only)
   */
  public async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }
}

