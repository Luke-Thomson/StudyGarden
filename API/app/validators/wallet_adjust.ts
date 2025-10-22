import vine from '@vinejs/vine'

export const walletAdjustValidator = vine.compile(
  vine.object({
    userId: vine.number().positive().optional(),
    amount: vine.number()
  })
)
