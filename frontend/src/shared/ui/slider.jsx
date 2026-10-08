import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/shared/lib/cn'

/** Dual-thumb range slider used by the price and area filters. */
export function RangeSlider({
  className,
  ...props
}) {
  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex h-5 w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label="Minimum"
        className="block size-5 rounded-full border-2 border-primary bg-surface shadow-control"
      />
      <SliderPrimitive.Thumb
        aria-label="Maximum"
        className="block size-5 rounded-full border-2 border-primary bg-surface shadow-control"
      />
    </SliderPrimitive.Root>
  )
}
