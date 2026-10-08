import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { LandPopup } from '@/features/lands/LandPopup'
import { LandsPanel } from '@/features/lands/LandsPanel'
import { NewLandSession } from '@/features/lands/new/NewLandSession'
import { PriceLabels } from '@/features/lands/PriceLabels'
import { useLandsQuery } from '@/features/lands/useLandsQuery'
import { MapCanvas } from '@/features/map/MapCanvas'
import { MapChip } from '@/features/map/MapChip'
import { MapContext, MapProvider, useMapContext } from '@/features/map/MapContext'
import { MapControls } from '@/features/map/MapControls'
import { MapStatusBar } from '@/features/map/MapStatusBar'
import { useBbox } from '@/features/map/useBbox'
import { useLandsLayer } from '@/features/map/useLandsLayer'
import { useLandSelection } from '@/features/map/useLandSelection'
import { useCircleSearch } from '@/features/search/useCircleSearch'
import { formatRadius } from '@/shared/lib/format'
import { polygonFromGeoJson } from '@/shared/lib/geo'
import { ApiError } from '@/shared/lib/http'

import { Toolbar } from './Toolbar'
import { TopRightNav } from './TopRightNav'

const EMPTY_LANDS = []

export function HomePage() {
  return (
    <MapProvider>
      <HomeScreen />
    </MapProvider>
  )
}

function HomeScreen() {
  const { map } = useMapContext()
  const location = useLocation()
  const navigate = useNavigate()
  const isCreate = location.pathname === '/lands/new'

  const [tool, setTool] = useState('select')
  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [detailLand, setDetailLand] = useState(null)
  const [conflictId, setConflictId] = useState(null)

  const bbox = useBbox()
  const query = useLandsQuery({ bbox, search, filters })
  const lands = query.data ?? EMPTY_LANDS

  // Query-level failures (e.g. 400 Problem Details on a GET) surface as toasts.
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.problem.detail) {
      toast.error(query.error.problem.detail)
    }
  }, [query.error])

  const { source, layer } = useLandsLayer(lands, {
    selectedId,
    hoveredId,
    conflictId,
    dimmed: isCreate,
  })

  const selectLand = useCallback(
    (id, options) => {
      setSelectedId(id)
      setDetailLand(null)
      if (id === null) return
      if (options?.center && map.getSize()) {
        const land = lands.find((candidate) => candidate.properties.id === id)
        if (land) {
          map.getView().fit(polygonFromGeoJson(land.geometry), {
            // Leave room for the floating panel on the left.
            padding: [80, 80, 80, 460],
            maxZoom: 18,
            duration: 300,
          })
        }
      }
    },
    [lands, map],
  )

  useLandSelection({
    layer,
    enabled: !isCreate && tool === 'select',
    onSelect: (id) => selectLand(id, { center: id !== null }),
    onHover: setHoveredId,
  })

  const circle = useCircleSearch({
    drawActive: !isCreate && tool === 'search',
    onSearchChange: setSearch,
  })

  // A land published from /lands/new arrives selected.
  const publishedId = (location.state)?.selectLand
  useEffect(() => {
    if (publishedId === undefined) return
    setSelectedId(publishedId)
    navigate(location.pathname, { replace: true, state: null })
  }, [publishedId, navigate, location.pathname])

  const selectedLand =
    lands.find((land) => land.properties.id === selectedId) ?? null

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-map-fallback">
      <MapCanvas />

      {/* Map decorations */}
      <PriceLabels
        lands={lands}
        selectedId={selectedId}
        hidden={isCreate}
        onSelect={(id) => selectLand(id, { center: true })}
      />
      <LandPopup
        land={!isCreate ? selectedLand : null}
        onClose={() => selectLand(null)}
        onViewDetails={() => setDetailLand(selectedLand)}
      />
      {!isCreate && circle.live && (
        <MapChip
          coordinate={circle.live.labelCoordinate}
          className="bg-search"
          offset={[14, 0]}
        >
          {formatRadius(circle.live.radiusMeters)}
        </MapChip>
      )}

      {/* UI chrome */}
      {isCreate ? (
        <NewLandSession
          lands={lands}
          landsSource={source}
          onConflictChange={setConflictId}
          onPublished={(id) => setSelectedId(id)}
        />
      ) : (
        <>
          <LandsPanel
            lands={lands}
            isLoading={query.isPending}
            isError={query.isError}
            onRetry={() => void query.refetch()}
            filters={filters}
            onFiltersChange={setFilters}
            searchRadius={search?.radius ?? null}
            onClearSearch={circle.clear}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={(id) => selectLand(id, { center: true })}
            onHover={setHoveredId}
            detailLand={detailLand}
            onCloseDetail={() => setDetailLand(null)}
          />
          <Toolbar
            tool={tool}
            onToolChange={setTool}
            showSearchHint={tool === 'search' && !circle.hasCircle}
          />
        </>
      )}

      <TopRightNav />
      <MapControls />
      <MapStatusBar />
    </div>
  )
}

// Re-exported so tests can render HomeScreen with an injected map context.
export { MapContext }
