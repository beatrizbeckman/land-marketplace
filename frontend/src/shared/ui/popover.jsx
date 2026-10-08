import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/shared/lib/cn'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 8,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-[12px] bg-surface p-4 shadow-popup outline-none',
          'transition-opacity duration-150',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
