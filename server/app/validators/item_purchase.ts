import vine from '@vinejs/vine'

export const itemPurchaseByIdValidator = vine.compile(
  vine.object({
    quantity: vine.number().withoutDecimals().min(1).optional(),
  })
)

export const itemPurchaseBySlugValidator = vine.compile(
  vine.object({
    slug: vine.string().trim().toLowerCase(),
    quantity: vine.number().withoutDecimals().min(1).optional(),
  })
)
