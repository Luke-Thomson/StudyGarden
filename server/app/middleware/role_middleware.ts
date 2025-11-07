// app/middleware/role_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

type RoleName = 'admin' | 'user'
type Options = { allow: RoleName[] } // usage: middleware.role({ allow: ['admin'] })

export default class RoleMiddleware {
  public async handle(ctx: HttpContext, next: NextFn, options?: Options) {
    const { auth, response } = ctx

    // must be authenticated before we can check the role
    if (!auth.user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    // admins pass everywhere
    if (auth.user.role === 'admin') {
      return next()
    }

    // if options not provided, deny non-admins by default
    const allowed = options?.allow ?? []
    if (!allowed.includes(auth.user.role)) {
      return response.forbidden({ message: 'Forbidden' })
    }

    return next()
  }
}
