import type { HttpContext } from '@adonisjs/core/http'
import LeaderboardService, { LeaderboardRange } from '#services/leaderboard_service'

const ALLOWED_RANGES: LeaderboardRange[] = ['day', 'week', 'month', 'year']

export default class LeaderboardController {
  public async study({ request, response }: HttpContext) {
    const rawRange = (request.input('range') || 'week').toString().toLowerCase()
    const range = (ALLOWED_RANGES.includes(rawRange as LeaderboardRange)
      ? rawRange
      : 'week') as LeaderboardRange

    const data = await LeaderboardService.study(range)
    return response.ok(data)
  }
}
