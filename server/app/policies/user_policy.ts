import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class UserPolicy extends BasePolicy {
  /**
   * Global override: if the user is an admin, allow everything.
   */
  public async before(user: User): Promise<AuthorizerResponse | void> {
    if (user.role === 'admin') {
      return true
    }
  }

  /**
   * Anyone logged in can create a user account (usually handled via /auth/register).
   * You may not even call this, but included for completeness.
   */
  public create(user: User): AuthorizerResponse {
    return !!user
  }

  /**
   * A user can only view their own record (admins pass via before()).
   */
  public view(user: User, target: User): AuthorizerResponse {
    return user.id === target.id
  }

  /**
   * A user can only update their own record (admins pass via before()).
   */
  public update(user: User, target: User): AuthorizerResponse {
    return user.id === target.id
  }

  /**
   * Normal users cannot delete accounts. Admin-only (via before()).
   */
  public delete(): AuthorizerResponse {
    return false
  }
}
