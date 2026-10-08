import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Feature from 'ol/Feature'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { MapChip } from '@/features/map/MapChip'
import { cn } from '@/shared/lib/cn'
import { formatArea, formatLotNumber } from '@/shared/lib/format'
import {
  findOverlappingLand,
  polygonAreaSqm,
  polygonFromGeoJson,
  polygonToGeoJson,
} from '@/shared/lib/geo'
import { ApiError, UnauthorizedError } from '@/shared/lib/http'
import { Button } from '@/shared/ui/button'

import { createLand } from '../api'
import { DetailsStep } from './DetailsStep'
import { draftStore } from './draftStore'
import { landFormSchema } from './landFormSchema'
import { OutlineStep } from './OutlineStep'
import { priceInputToNumber } from './priceInput'
import { useDraftPolygon } from './useDraftPolygon'

/**
 * Orchestrates the whole "List your land" flow: panel steps, the draft layer
 * on the map, the live overlap pre-check (mirroring the backend rule) and
 * publishing with full API error handling.
 */
export function NewLandSession({
  lands,
  landsSource,
  onConflictChange,
  onPublished,
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState('outline')
  const [draft, setDraft] = useState(null)
  const [sketch, setSketch] = useState({
    vertices: 0,
    areaSqm: 0,
    cursor: null,
    polygon: null,
  })
  const [sketchConflict, setSketchConflict] = useState(null)
  const [serverConflict, setServerConflict] = useState(false)
  const [geometryError, setGeometryError] = useState(null)

  const form = useForm({
    resolver: zodResolver(landFormSchema),
    mode: 'onChange',
    defaultValues: { price: '', description: '', contact: '' },
  })

  const draftGeoJson = useMemo(
    () => (draft ? polygonToGeoJson(draft.polygon) : null),
    [draft],
  )

  // Authoritative pre-check input is the closed draft; while sketching we also
  // check the partial ring (sketchConflict) on every vertex.
  const conflict = useMemo(() => {
    if (!draftGeoJson) return sketchConflict
    const ring = draftGeoJson.coordinates[0]
    if (!ring || ring.length < 4) return null
    return findOverlappingLand(draftGeoJson, lands)
  }, [draftGeoJson, lands, sketchConflict])

  const overlapping = conflict !== null || serverConflict

  useEffect(() => {
    onConflictChange(conflict?.properties.id ?? null)
    return () => onConflictChange(null)
  }, [conflict, onConflictChange])

  // Overlap pre-check on every vertex while sketching, not only after closing.
  const onSketchChange = useCallback(
    (info) => {
      setSketch(info)
      if (!info.polygon) {
        setSketchConflict(null)
        return
      }
      try {
        const sketchGeoJson = polygonToGeoJson(info.polygon)
        const ring = sketchGeoJson.coordinates[0]
        setSketchConflict(
          ring && ring.length >= 4 ? findOverlappingLand(sketchGeoJson, lands) : null,
        )
      } catch {
        setSketchConflict(null)
      }
    },
    [lands],
  )

  const onPolygonChange = useCallback((polygon) => {
    setDraft((current) => ({ polygon, version: (current?.version ?? 0) + 1 }))
    setServerConflict(false)
    setGeometryError(null)
    setStep('details')
  }, [])

  const { source, undoLastPoint, clear } = useDraftPolygon({
    mode: step === 'outline' ? 'draw' : 'edit',
    snapSource: landsSource,
    invalid: overlapping,
    onSketchChange,
    onPolygonChange,
  })

  // Restore a draft kept across the login redirect (401 while publishing).
  useEffect(() => {
    const stored = draftStore.load()
    if (!stored) return
    draftStore.clear()
    const polygon = polygonFromGeoJson(stored.geometry)
    source.addFeature(new Feature(polygon))
    form.reset(stored.values)
    setDraft({ polygon, version: 1 })
    setStep('details')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  const previewAreaSqm = draft ? polygonAreaSqm(draft.polygon) : 0

  const cancel = useCallback(() => {
    clear()
    draftStore.clear()
    navigate('/')
  }, [clear, navigate])

  const redraw = useCallback(() => {
    clear()
    setDraft(null)
    setServerConflict(false)
    setGeometryError(null)
    setStep('outline')
  }, [clear])

  const publishMutation = useMutation({ mutationFn: createLand })

  const publish = form.handleSubmit(async (values) => {
    if (!draftGeoJson) return
    try {
      const created = await publishMutation.mutateAsync({
        geometry: draftGeoJson,
        price: priceInputToNumber(values.price),
        description: values.description,
        contact: values.contact,
      })
      toast.success('Land published')
      draftStore.clear()
      await queryClient.invalidateQueries({ queryKey: ['lands'] })
      onPublished(created.properties.id)
      navigate('/')
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        draftStore.save({ geometry: draftGeoJson, values })
        navigate('/login', { state: { from: '/lands/new' } })
      } else if (error instanceof ApiError && error.status === 409) {
        setServerConflict(true)
      } else if (error instanceof ApiError && error.problem.errors) {
        for (const violation of error.problem.errors) {
          if (violation.field === 'geometry') {
            setGeometryError(violation.message)
          } else if (
            violation.field === 'price' ||
            violation.field === 'description' ||
            violation.field === 'contact'
          ) {
            form.setError(violation.field, { message: violation.message })
          }
        }
      } else if (error instanceof ApiError) {
        toast.error(error.problem.detail ?? 'An unexpected error occurred')
      } else {
        toast.error("Couldn't reach the server. Check your connection and try again.")
      }
    }
  })

  const draftCenter = draft
    ? draft.polygon.getInteriorPoint().getCoordinates()
    : null
  const conflictCenter = conflict
    ? polygonFromGeoJson(conflict.geometry).getInteriorPoint().getCoordinates()
    : null

  return (
    <>
      <section className="absolute bottom-4 left-4 top-4 z-10 flex w-[380px] flex-col overflow-hidden rounded-[14px] bg-surface shadow-panel max-md:inset-x-2 max-md:w-auto">
        <header className="flex items-center gap-2 border-b border-line p-4">
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel and go back"
            className="flex size-9 items-center justify-center rounded-[10px] hover:bg-surface-muted"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h2 className="font-semibold">List your land</h2>
        </header>

        <div className="flex gap-2 border-b border-line px-4 py-3">
          {(['Outline', 'Details']).map((label, index) => {
            const stepActive = (index === 0) === (step === 'outline')
            return (
              <span
                key={label}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm',
                  stepActive ? 'bg-primary-soft font-semibold text-primary' : 'text-muted',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-xs',
                    stepActive ? 'bg-primary text-white' : 'bg-surface-muted',
                  )}
                >
                  {index + 1}
                </span>
                {label}
              </span>
            )
          })}
        </div>

        {step === 'outline' ? (
          <OutlineStep
            vertices={sketch.vertices}
            areaSqm={sketch.areaSqm}
            onCancel={cancel}
            onUndoLastPoint={undoLastPoint}
          />
        ) : (
          <DetailsStep
            form={form}
            geometry={draftGeoJson}
            previewAreaSqm={previewAreaSqm}
            overlapping={overlapping}
            geometryError={geometryError}
            isPublishing={publishMutation.isPending}
            onCancel={cancel}
            onPublish={publish}
          />
        )}
      </section>

      {/* Hint where the toolbar normally sits */}
      <div className="absolute left-[412px] top-4 z-10 flex items-center gap-2 rounded-[12px] bg-surface px-3 py-2 shadow-control max-md:hidden">
        <span className="text-sm text-muted-strong">
          {step === 'outline'
            ? 'Click the first point or double-click to finish'
            : 'Drag a point to adjust the outline'}
        </span>
        {step === 'details' && (
          <Button size="chip" variant="outline" onClick={redraw}>
            Redraw
          </Button>
        )}
      </div>

      {/* Live area label next to the cursor while sketching */}
      {step === 'outline' && sketch.areaSqm > 0 && (
        <MapChip coordinate={sketch.cursor} className="bg-ink">
          {formatArea(sketch.areaSqm)}
        </MapChip>
      )}

      {/* Conflict chips: over the draft and over the conflicting land */}
      {conflict && (
        <MapChip coordinate={draftCenter} className="bg-danger" positioning="center-center" offset={[0, -24]}>
          Overlaps {formatLotNumber(conflict.properties.id)}
        </MapChip>
      )}
      {conflict && (
        <MapChip coordinate={conflictCenter} className="bg-ink" positioning="center-center" offset={[0, 0]}>
          {formatLotNumber(conflict.properties.id)}
        </MapChip>
      )}
    </>
  )
}
