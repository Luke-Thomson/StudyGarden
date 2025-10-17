import vine from '@vinejs/vine'

export const authRegisterValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine.string().trim().email(),
    password: vine.string().minLength(6),
  })
)
