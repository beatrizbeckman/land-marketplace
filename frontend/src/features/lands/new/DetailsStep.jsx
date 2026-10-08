import { TriangleAlert } from 'lucide-react'
import { Controller } from 'react-hook-form'

import { LandThumbnail } from '@/features/lands/LandThumbnail'
import { formatArea, formatPricePerSqm } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { FieldError } from '@/shared/ui/field-error'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'

import { isValidPriceInput, maskPriceInput, priceInputToNumber } from './priceInput'

/** Step 2 panel: summary of the outline plus the land details form. */
export function DetailsStep({
  form,
  geometry,
  previewAreaSqm,
  overlapping,
  geometryError,
  isPublishing,
  onCancel,
  onPublish,
}) {
  const {
    register,
    control,
    watch,
    formState: { errors, isValid },
  } = form

  const price = watch('price')
  const description = watch('description') ?? ''
  const pricePerSqm =
    price && isValidPriceInput(price) && previewAreaSqm > 0
      ? formatPricePerSqm(priceInputToNumber(price), previewAreaSqm)
      : '—'

  const publishDisabled = !isValid || overlapping || isPublishing || geometry === null

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onPublish()
      }}
    >
      <div className="flex-1 overflow-y-auto p-4">
        {overlapping && (
          <div
            role="alert"
            className="mb-3 rounded-[10px] border border-danger bg-danger-soft p-3"
          >
            <p className="flex items-center gap-1.5 font-semibold text-danger-ink">
              <TriangleAlert aria-hidden className="size-4 shrink-0" />
              This area overlaps an existing land
            </p>
            <p className="mt-1 text-sm text-danger-ink">
              Interiors cannot share area. Touching a boundary or a corner is
              allowed — drag the points until the shapes no longer overlap.
            </p>
          </div>
        )}
        {geometryError && <FieldError message={geometryError} />}

        <div className="flex items-center gap-3 rounded-[10px] border border-line p-3">
          {geometry && <LandThumbnail geometry={geometry} danger={overlapping} />}
          <div className="grid flex-1 grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted">Area</p>
              <p className="font-semibold">
                {previewAreaSqm > 0 ? formatArea(previewAreaSqm) : '—'}
              </p>
              <p className="text-xs text-muted">
                {previewAreaSqm > 0 ? `${Math.round(previewAreaSqm).toLocaleString('en-US')} m²` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Price per m²</p>
              <p className="font-semibold">{pricePerSqm}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="land-price">Total price</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
              R$
            </span>
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <Input
                  id="land-price"
                  inputMode="decimal"
                  className="pl-9"
                  invalid={!!errors.price}
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(maskPriceInput(event.target.value))}
                />
              )}
            />
          </div>
          <FieldError message={errors.price?.message} />
        </div>

        <div className="mt-4">
          <Label htmlFor="land-description">Description</Label>
          <Textarea
            id="land-description"
            invalid={!!errors.description}
            maxLength={500}
            {...register('description')}
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>10 to 500 characters</span>
            <span>{description.length} / 500</span>
          </div>
          <FieldError message={errors.description?.message} />
        </div>

        <div className="mt-4">
          <Label htmlFor="land-contact">Contact</Label>
          <Input
            id="land-contact"
            placeholder="E-mail or phone"
            invalid={!!errors.contact}
            {...register('contact')}
          />
          <p className="mt-1 text-xs text-muted">Shown to buyers on the land popup.</p>
          <FieldError message={errors.contact?.message} />
        </div>
      </div>

      <footer className="border-t border-line p-4">
        {overlapping && (
          <p className="mb-2 text-xs text-muted-strong">
            Fix the outline to publish. Your details are kept.
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[2]" disabled={publishDisabled}>
            {isPublishing ? 'Publishing…' : 'Publish land'}
          </Button>
        </div>
      </footer>
    </form>
  )
}
