import type { HttpContext } from '@adonisjs/core/http'

export default class MeController {
  public async show({ auth }: HttpContext) {
    return auth.user! // already authenticated by middleware
  }

  public async update({ auth, request }: HttpContext) {
    const user = auth.user!
    user.merge(request.only(['fullName', 'email', 'password'])) // whitelist allowed fields
    await user.save()
    return user
  }
}
