import vine from '@vinejs/vine'

const metadataSchema = vine.object({}).allowUnknownProperties().optional()

export const itemUpdateValidator = vine.compile(
  vine.object({
    slug: vine
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_-]+$/)
      .maxLength(100)
      .optional(),
    name: vine.string().trim().minLength(2).maxLength(200).optional(),
    type: vine.string().trim().minLength(2).maxLength(100).optional(),
    price: vine.number().withoutDecimals().min(0),
    description: vine.string().trim().maxLength(2000).nullable().optional(),
    metadata: metadataSchema,
  })
)
