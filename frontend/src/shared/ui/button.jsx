import { cva } from 'class-variance-authority'

import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold ' +
    'transition-colors duration-150 disabled:pointer-events-none ' +
    'disabled:bg-line disabled:text-muted-strong',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90',
        outline:
          'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
        ghost: 'bg-transparent text-ink hover:bg-surface-muted',
      },
      size: {
        /** Form buttons and inputs are 48px tall. */
        form: 'h-12 px-4',
        /** Map and popup buttons are 44px tall. */
        map: 'h-11 px-3',
        chip: 'h-9 px-3 rounded-full text-sm font-medium',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'form',
    },
  },
)

export function Button({ className, variant, size, type, ...props }) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
