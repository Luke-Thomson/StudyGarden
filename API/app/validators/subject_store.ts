import vine from '@vinejs/vine'

export const subjectStoreValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(200),
  })
)
