import { cn } from '@/shared/lib/cn'

export function Input({ className, invalid = false, ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-12 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm',
        'placeholder:text-muted transition-colors duration-150',
        invalid && 'border-2 border-danger',
        className,
      )}
      {...props}
    />
  )
}
