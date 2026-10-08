import { z } from 'zod'

/** Mirrors the backend bean validation exactly; messages are our own (English). */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must have at most 100 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'E-mail is required')
    .email('Enter a valid e-mail')
    .max(255, 'E-mail must have at most 255 characters'),
  // 72 is BCrypt's input limit: it only hashes the first 72 bytes, so the
  // backend rejects longer passwords instead of silently truncating them.
  password: z
    .string()
    .min(8, 'Password must have at least 8 characters')
    .max(72, 'Password must have at most 72 characters'),
})

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'E-mail is required').email('Enter a valid e-mail'),
  password: z.string().min(1, 'Password is required'),
})
