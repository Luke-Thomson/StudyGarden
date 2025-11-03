import vine from '@vinejs/vine'

const metadataSchema = vine
  .object({})
  .allowUnknownProperties()
  .optional()

export const inventoryAdjustValidator = vine.compile(
  vine.object({
    userId: vine.number().positive().optional(),
    itemId: vine.number().positive(),
    quantityChange: vine.number(),
    metadata: metadataSchema,
  })
)
