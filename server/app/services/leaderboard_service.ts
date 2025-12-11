import TimerSession from '#models/timer_session'
import { DateTime } from 'luxon'

export type LeaderboardRange = 'day' | 'week' | 'month' | 'year'

export default class LeaderboardService {
  static getRangeStart(range: LeaderboardRange): DateTime {
    const now = DateTime.utc()

    switch (range) {
      case 'day':
        return now.startOf('day')
      case 'week':
        return now.startOf('week') // Monday as start; fine for a study app
      case 'month':
        return now.startOf('month')
      case 'year':
        return now.startOf('year')
      default:
        return now.startOf('week')
    }
  }

  static async study(range: LeaderboardRange) {
    const now = DateTime.utc()
    const from = this.getRangeStart(range)

    const sessions = await TimerSession.query()
      .where('mode', 'STUDY')
      .where('status', 'COMPLETED')
      .where('startedAt', '>=', from.toJSDate()) // Date, not string
      .preload('user')

    type Agg = {
      userId: number
      fullName: string | null
      email: string
      totalSeconds: number
      sessionsCount: number
    }

    const byUser = new Map<number, Agg>()

    for (const s of sessions) {
      if (!s.startedAt || !s.endedAt) continue

      const seconds = s.endedAt.diff(s.startedAt, 'seconds').seconds
      if (!Number.isFinite(seconds) || seconds <= 0) continue

      const user = s.user
      if (!user) continue

      const existing = byUser.get(s.userId) ?? {
        userId: s.userId,
        fullName: user.fullName ?? null,
        email: user.email,
        totalSeconds: 0,
        sessionsCount: 0,
      }

      existing.totalSeconds += seconds
      existing.sessionsCount += 1

      byUser.set(s.userId, existing)
    }

    const entries = Array.from(byUser.values())
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 50)
      .map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        fullName: row.fullName,
        email: row.email,
        totalSeconds: Math.round(row.totalSeconds),
        totalMinutes: Math.floor(row.totalSeconds / 60),
        sessionsCount: row.sessionsCount,
      }))

    return {
      range,
      from: from.toISO(),
      to: now.toISO(),
      entries,
    }
  }
}
