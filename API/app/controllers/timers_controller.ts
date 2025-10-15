import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import TimerSession from '#models/timer_session'

type TimerMode = 'STUDY' | 'BREAK_SHORT' | 'BREAK_LONG'

export default class TimersController {
  // POST /api/timer/start  body: { mode?: 'STUDY'|'BREAK_SHORT'|'BREAK_LONG', durationSec: number|string }
  public async start({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()

    // Coerce + validate inputs
    const rawMode = request.input('mode', 'STUDY')
    const mode: TimerMode =
      rawMode === 'BREAK_SHORT' || rawMode === 'BREAK_LONG' ? rawMode : 'STUDY'

    const durationSec = Number(request.input('durationSec'))
    if (!Number.isFinite(durationSec) || durationSec < 60 || durationSec > 3600) {
      return response.badRequest({ message: 'durationSec must be a number between 60 and 3600' })
    }

    // Disallow or auto-abandon a running session
    const existing = await TimerSession.query()
      .where('userId', user.id)
      .where('status', 'RUNNING')
      .first()

    if (existing) {
      const plannedEnd = existing.startedAt.plus({ seconds: existing.expectedDurationSec })
      if (DateTime.now() > plannedEnd.plus({ seconds: 30 })) {
        existing.status = 'ABANDONED'
        existing.endedAt = plannedEnd
        await existing.save()
      } else {
        return response.badRequest({ message: 'A session is already running', sessionId: existing.id })
      }
    }

    const now = DateTime.now()
    const session = await TimerSession.create({
      userId: user.id,
      mode,
      expectedDurationSec: durationSec,
      status: 'RUNNING',
      startedAt: now,
    })

    return response.ok({
      sessionId: session.id,
      serverNow: now.toISO(),
      plannedEndAt: now.plus({ seconds: durationSec }).toISO(),
      mode: session.mode,
      expectedDurationSec: durationSec,
    })
  }

  // POST /api/timer/stop  body: { sessionId: number }
  public async stop({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const sessionId = Number(request.input('sessionId'))
    if (!Number.isFinite(sessionId) || sessionId < 1) {
      return response.badRequest({ message: 'sessionId is required' })
    }

    const session = await TimerSession.find(sessionId)
    if (!session || session.userId !== user.id) {
      return response.forbidden({ message: 'Session not found or not owned by user' })
    }
    if (session.status !== 'RUNNING') {
      return response.badRequest({ message: 'Session is not running' })
    }

    const plannedEnd = session.startedAt.plus({ seconds: session.expectedDurationSec })
    const maxEnd = plannedEnd.plus({ seconds: 30 })
    const now = DateTime.now()
    const endAt = now < maxEnd ? now : maxEnd

    session.endedAt = endAt
    session.status = 'COMPLETED'
    await session.save()

    return response.ok({
      message: 'Session stopped successfully',
      sessionId: session.id,
      mode: session.mode,
      startedAt: session.startedAt.toISO(),
      endedAt: session.endedAt?.toISO(),
      actualSeconds: session.endedAt?.diff(session.startedAt, 'seconds').seconds,
    })
  }

  // GET /me/sessions
  public async mine({ auth }: HttpContext) {
    const user = auth.user!
    return TimerSession.query().where('user_id', user.id)
  }
}
