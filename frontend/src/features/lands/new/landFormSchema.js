import { z } from 'zod'

import { isEmail, isPhone } from '@/shared/lib/contact'

import { isValidPriceInput } from './priceInput'

/** Mirrors the backend validation of POST /api/lands properties exactly. */
export const landFormSchema = z.object({
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(isValidPriceInput, {
      message: 'Price must be greater than 0, with at most 2 decimal places',
    }),
  description: z
    .string()
    .trim()
    .min(10, 'Description must have at least 10 characters')
    .max(500, 'Description must have at most 500 characters'),
  contact: z
    .string()
    .trim()
    .min(1, 'Contact is required')
    .max(255, 'Contact must have at most 255 characters')
    .refine((value) => isEmail(value) || isPhone(value), {
      message: 'Contact must be a valid e-mail or a phone with 10 to 15 digits',
    }),
})
