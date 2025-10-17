import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { authRegisterValidator } from '#validators/auth_register'
import { authLoginValidator } from '#validators/auth_login'

export default class AuthController {
  public async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(authRegisterValidator)

    try {
      // role defaults to 'user' at DB or model level; set explicitly if you prefer
      const user = await User.create({ ...data, role: 'user' })
      return response.created({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt?.toISO(),
      })
    } catch (err: any) {
      // Handle unique email nicely
      return response.conflict({ message: 'Email already in use' })
    }
  }

  public async login({ request, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(authLoginValidator)
    const user = await User.verifyCredentials(email, password)
    const token = await auth.use('api').createToken(user)

    return token
  }

  public async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
    return response.noContent()
  }
}

