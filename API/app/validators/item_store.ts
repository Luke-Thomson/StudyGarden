import vine from '@vinejs/vine'

const metadataSchema = vine
  .object({})
  .allowUnknownProperties()
  .optional()

export const itemStoreValidator = vine.compile(
  vine.object({
    slug: vine
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_-]+$/)
      .maxLength(100),
    name: vine.string().trim().minLength(2).maxLength(200),
    type: vine.string().trim().minLength(2).maxLength(100),
    description: vine.string().trim().maxLength(2000).optional(),
    metadata: metadataSchema,
  })
)
