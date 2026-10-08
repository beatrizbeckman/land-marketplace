import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges Tailwind classes, letting the last conflicting class win. */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
