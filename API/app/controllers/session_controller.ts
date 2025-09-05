import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class SessionController {
  // POST /session  -> returns bearer token
  async store({ request, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)   // timing-attack safe
    return await auth.use('api').createToken(user)               // { type, value, expiresAt }
  }

  // DELETE /session -> invalidates the *current* token
  async destroy({ auth }: HttpContext) {
    await auth.use('api').invalidateToken()
  }
}
