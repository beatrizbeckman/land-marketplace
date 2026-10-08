import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { RangeSlider } from '@/shared/ui/slider'

/**
 * Filter chip that opens a popover with min/max inputs and a dual slider.
 * Values only take effect on "Show N lands"; closing by clicking outside
 * discards the edit; "Clear" resets this filter and closes.
 */
export function RangeFilterChip({
  chipLabel,
  title,
  bounds,
  applied,
  appliedLabel,
  totalCount,
  inputPrefix,
  countMatching,
  onApply,
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(bounds)

  const openWithDraft = (next) => {
    if (next) {
      setDraft({
        min: applied?.min ?? bounds.min,
        max: applied?.max ?? bounds.max,
      })
    }
    setOpen(next)
  }

  const matchCount = countMatching(draft)
  const isApplied = applied !== null

  return (
    <Popover open={open} onOpenChange={openWithDraft}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 text-sm font-medium transition-colors duration-150',
            isApplied && 'border-primary bg-primary-soft text-primary',
            open && 'border-primary bg-primary text-white',
          )}
        >
          {appliedLabel ?? chipLabel}
          <ChevronDown className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[348px]">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-xs text-muted">
            {matchCount} of {totalCount} lands match
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <label className="flex-1 text-xs text-muted">
            Minimum
            <span className="mt-1 flex items-center gap-1">
              {inputPrefix && <span className="text-sm text-muted">{inputPrefix}</span>}
              <Input
                className="h-11"
                inputMode="numeric"
                value={String(draft.min)}
                onChange={(event) => {
                  const value = Number(event.target.value.replace(/\D/g, '')) || 0
                  setDraft((current) => ({ ...current, min: value }))
                }}
              />
            </span>
          </label>
          <label className="flex-1 text-xs text-muted">
            Maximum
            <span className="mt-1 flex items-center gap-1">
              {inputPrefix && <span className="text-sm text-muted">{inputPrefix}</span>}
              <Input
                className="h-11"
                inputMode="numeric"
                value={String(draft.max)}
                onChange={(event) => {
                  const value = Number(event.target.value.replace(/\D/g, '')) || 0
                  setDraft((current) => ({ ...current, max: value }))
                }}
              />
            </span>
          </label>
        </div>

        <RangeSlider
          className="mt-4"
          min={bounds.min}
          max={bounds.max}
          step={Math.max(1, Math.round((bounds.max - bounds.min) / 100))}
          value={[draft.min, draft.max]}
          onValueChange={([min, max]) => setDraft({ min: min ?? bounds.min, max: max ?? bounds.max })}
        />

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="text-sm font-medium text-muted-strong underline"
            onClick={() => {
              onApply(null)
              setOpen(false)
            }}
          >
            Clear
          </button>
          <Button
            size="map"
            onClick={() => {
              onApply(draft)
              setOpen(false)
            }}
          >
            Show {matchCount} lands
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
