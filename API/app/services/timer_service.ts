import { DateTime } from 'luxon'
import TimerSession from '#models/timer_session'
import Subject from '#models/subject'

export type TimerMode = 'STUDY' | 'BREAK_SHORT' | 'BREAK_LONG'

export default class TimerService {
  private GRACE_SEC = 30

  /**
   * Start a session (auto-abandon stale RUNNING one).
   * Enforces: subjectId required + owned for STUDY mode.
   */
  public async startSession(userId: number, args: {
    mode?: TimerMode,
    durationSec: number,
    subjectId?: number
  }) {
    const mode: TimerMode = args.mode ?? 'STUDY'

    // For STUDY, subjectId is required & must belong to user
    let subjectId: number | null = null
    if (mode === 'STUDY') {
      if (!args.subjectId || args.subjectId < 1) {
        return { error: 'SUBJECT_REQUIRED' } as const
      }
      const subject = await Subject
        .query()
        .where('id', args.subjectId)
        .where('userId', userId)
        .first()
      if (!subject) return { error: 'SUBJECT_NOT_OWNED' } as const
      subjectId = args.subjectId
    }

    // Disallow or auto-abandon existing RUNNING
    const existing = await TimerSession.query()
      .where('userId', userId)
      .where('status', 'RUNNING')
      .first()

    if (existing) {
      const plannedEnd = existing.startedAt.plus({ seconds: existing.expectedDurationSec })
      const now = DateTime.now()
      if (now > plannedEnd.plus({ seconds: this.GRACE_SEC })) {
        existing.status = 'ABANDONED'
        existing.endedAt = plannedEnd
        await existing.save()
      } else {
        return { error: 'ALREADY_RUNNING', sessionId: existing.id } as const
      }
    }

    const now = DateTime.now()
    const session = await TimerSession.create({
      userId,
      mode,
      expectedDurationSec: args.durationSec,
      status: 'RUNNING',
      startedAt: now,
      subjectId, // null for breaks
    })

    return {
      session,
      serverNow: now,
      plannedEndAt: now.plus({ seconds: args.durationSec }),
    } as const
  }

  /**
   * Stop a running session owned by the user.
   * Sets server-trusted endedAt, computes actualSeconds, and marks COMPLETED.
   * Returns the saved session + actualSeconds for UI/analytics.
   */
  public async stopSession(userId: number, sessionId: number) {
    const s = await TimerSession.find(sessionId)
    if (!s || s.userId !== userId) return { error: 'NOT_OWNED_OR_NOT_FOUND' } as const
    if (s.status !== 'RUNNING') return { error: 'NOT_RUNNING' } as const

    // Server chooses a safe end time: min(now, plannedEnd + GRACE)
    const plannedEnd = s.startedAt.plus({ seconds: s.expectedDurationSec })
    const now = DateTime.now()
    const maxEnd = plannedEnd.plus({ seconds: this.GRACE_SEC })
    const endAt = now < maxEnd ? now : maxEnd

    s.endedAt = endAt
    s.status = 'COMPLETED'
    await s.save() // <-- WalletService relies on startedAt/endedAt being persisted

    const actualSeconds = Math.max(0, endAt.diff(s.startedAt, 'seconds').seconds)
    return { session: s, actualSeconds } as const
  }

  /**
   * List sessions for the user (raw rows).
   */
  public async listMine(userId: number) {
    return TimerSession.query().where('userId', userId)
  }

  /**
   * List session totals for the user.
   * Returns total completed study time in seconds and minutes.
   */
  public async myTotal(userId: number) {
    // Only count completed STUDY sessions
    const sessions = await TimerSession.query()
      .where('userId', userId)
      .where('mode', 'STUDY')
      .where('status', 'COMPLETED')

    let totalSeconds = 0

    for (const s of sessions) {
      if (s.startedAt && s.endedAt) {
        totalSeconds += s.endedAt.diff(s.startedAt, 'seconds').seconds
      }
    }

    return {
      totalSeconds,
      totalMinutes: Math.floor(totalSeconds / 60),
      sessionsCount: sessions.length,
    }
  }
}
