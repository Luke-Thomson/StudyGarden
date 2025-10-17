import vine from '@vinejs/vine'

export const subjectUpdateValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(200).optional(),
  })
)
