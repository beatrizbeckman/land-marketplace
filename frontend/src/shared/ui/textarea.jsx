import { cn } from '@/shared/lib/cn'

export function Textarea({ className, invalid = false, ...props }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-24 w-full rounded-[10px] border border-line-strong bg-surface p-3 text-sm',
        'placeholder:text-muted transition-colors duration-150',
        invalid && 'border-2 border-danger',
        className,
      )}
      {...props}
    />
  )
}
