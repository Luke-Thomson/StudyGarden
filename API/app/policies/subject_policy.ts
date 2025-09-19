import User from '#models/user'
import Subject from '#models/subject'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class SubjectPolicy extends BasePolicy {
  /**
   * Optional global override:
   * If the user is an admin, allow everything.
   * Return true to allow, false to deny, or void to continue to method checks.
   */
  public async before(user: User) {
    if (user.role === 'admin') {
      return true
    }
  }

  /**
   * Anyone logged in can create a subject (it will be scoped to their own userId in the controller)
   */
  public create(user: User): AuthorizerResponse {
    return !!user
  }

  /**
   * Only the owner (or admin via before()) can view
   */
  public view(user: User, subject: Subject): AuthorizerResponse {
    return user.id === subject.userId
  }

  /**
   * Only the owner (or admin) can edit/update
   */
  public edit(user: User, subject: Subject): AuthorizerResponse {
    return user.id === subject.userId
  }

  /**
   * Only the owner (or admin) can delete
   */
  public delete(user: User, subject: Subject): AuthorizerResponse {
    return user.id === subject.userId
  }
}
