import User from '#models/user'
import Item from '#models/item'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import UserSeedUnlock from "#models/user_seed_unlock";

export default class ItemPolicy extends BasePolicy {
  /**
   * Allow admins to bypass all item-specific checks.
   */
  public async before(user: User): Promise<AuthorizerResponse | void> {
    if (user.role === 'admin') {
      return true
    }
  }

  /**
   * Any authenticated user may list catalog entries.
   */
  public index(user: User): AuthorizerResponse {
    return !!user
  }

  /**
   * Any authenticated user may view a specific catalog item.
   */
  public view(user: User, _item: Item): AuthorizerResponse {
    return !!user
  }

  /**
   * Only admins (handled in before) can create new catalog entries.
   */
  public create(): AuthorizerResponse {
    return false
  }

  /**
   * Only admins (handled in before) can update catalog entries.
   */
  public update(): AuthorizerResponse {
    return false
  }

  /**
   * Only admins (handled in before) can delete catalog entries.
   */
  public delete(): AuthorizerResponse {
    return false
  }

  /**
   * Any authenticated user may purchase items and unlocked seeds.
   */
  public async purchase(user: User, item: Item) {
    if (item.type !== 'seed') return !!user  // packs, tools, etc.
    const row = await UserSeedUnlock.query()
      .where('user_id', user.id)
      .andWhere('seed_item_id', item.id)
      .first()
    return !!row
  }
}
