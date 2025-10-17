import vine from '@vinejs/vine'

export const timerStartValidator = vine.compile(
  vine.object({
    mode: vine.enum(['STUDY', 'BREAK_SHORT', 'BREAK_LONG']),
    durationSec: vine.number().min(60).max(3600),
    // Required only for STUDY
    subjectId: vine.number().optional(),
  })
)
