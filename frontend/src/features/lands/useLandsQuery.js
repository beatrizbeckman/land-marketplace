import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchLandsByBbox, searchLandsByCircle } from './api'

/**
 * Lands currently shown on the map and in the panel. The query key carries
 * every input, so changing the circle or the filters cancels the in-flight
 * request (TanStack Query aborts via the signal) and refetches.
 */
export function useLandsQuery({ bbox, search, filters }) {
  return useQuery({
    queryKey: ['lands', search ? { search, filters } : { bbox, filters }],
    queryFn: ({ signal }) =>
      search
        ? searchLandsByCircle(search, filters, signal)
        : fetchLandsByBbox(bbox, filters, signal),
    enabled: search !== null || bbox !== null,
    select: (collection) => collection.features,
    placeholderData: keepPreviousData,
    retry: 1,
  })
}
