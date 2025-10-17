import vine from '@vinejs/vine'

export const userStoreValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine.string().trim().email(),
    password: vine.string().minLength(6),
    role: vine.enum(['user', 'admin']) // default handled by model or migration
  })
)
