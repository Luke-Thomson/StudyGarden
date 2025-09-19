import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  public async register({ request }: HttpContext) {
    const { fullName, email, password } = request.only(['fullName', 'email', 'password'])
    const user = await User.create({ fullName, email, password, role: 'user' })
    return user
  }

  public async login({ request, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)
    const token = await auth.use('api').createToken(user)
    return token
  }

  public async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
    return response.noContent()
  }
}
