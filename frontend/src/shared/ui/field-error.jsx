import { TriangleAlert } from 'lucide-react'

export function FieldError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1 text-sm text-danger">
      <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}
