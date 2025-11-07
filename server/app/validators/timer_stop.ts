import vine from '@vinejs/vine'

export const timerStopValidator = vine.compile(
  vine.object({
    sessionId: vine.number().min(1),
  })
)
