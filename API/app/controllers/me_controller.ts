import type { HttpContext } from '@adonisjs/core/http'
import { meUpdateValidator } from '#validators/me_update'

export default class MeController {
  /**
   * GET /me
   * Return the authenticated user's profile
   */
  public async show({ auth }: HttpContext) {
    return auth.user! // middleware already guarantees auth
  }

  /**
   * PATCH /me
   * Update current user's name, email, or password
   */
  public async update({ auth, request }: HttpContext) {
    const user = auth.user!
    const data = await request.validateUsing(meUpdateValidator)

    user.merge(data)
    await user.save()
    return user
  }
}

