import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

// all of these endpoints are admin only

export default class UsersController {
  /**
   * Display a list of resource
   */
  public async index({ }: HttpContext) {
    return User.query()
  }

  /**
   * Handle form submission for the create action
   */
  public async store({ request }: HttpContext) {
    const payload = request.only(['fullName', 'email', 'password', 'role'])
    const user = await User.create(payload)
    return user
  }

  /**
   * Show individual record
   */
  public async show({ params }: HttpContext) {
    return User.findOrFail(params.id)
  }

  /**
   * Handle form submission for the edit action
   */
  public async update({ params, request }: HttpContext) {
    const user = await User.findOrFail(params.id)
    user.merge(request.only(['email', 'role'])) // be careful exposing 'role'
    await user.save()
    return user
  }

  /**
   * Delete record
   */
  public async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }
}
