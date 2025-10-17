import vine from '@vinejs/vine'

export const userUpdateValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine.string().trim().email().optional(),
    password: vine.string().minLength(6).optional(),
    role: vine.enum(['user', 'admin']).optional(),
  })
)
