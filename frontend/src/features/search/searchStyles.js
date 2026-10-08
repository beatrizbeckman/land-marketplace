import CircleGeometry from 'ol/geom/Circle'
import LineString from 'ol/geom/LineString'
import MultiPoint from 'ol/geom/MultiPoint'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'

const SEARCH = 'rgba(29, 78, 216, 1)'
const SEARCH_FILL = 'rgba(29, 78, 216, 0.08)'

/**
 * Style for the search circle: dashed blue outline, light fill, a line from
 * the center to the resize handle, and white handle dots. The handle follows
 * the cursor while drawing (handleRef) and rests at the east edge afterwards.
 */
export function createSearchStyle(
  handleRef,
) {
  return (feature) => {
    const geometry = feature.getGeometry()
    if (!(geometry instanceof CircleGeometry)) return []

    const center = geometry.getCenter()
    const fallbackHandle = [center[0] + geometry.getRadius(), center[1]]
    const handle = handleRef.current ?? fallbackHandle

    const handleDot = new CircleStyle({
      radius: 5,
      fill: new Fill({ color: 'white' }),
      stroke: new Stroke({ color: SEARCH, width: 2 }),
    })

    return [
      new Style({
        fill: new Fill({ color: SEARCH_FILL }),
        stroke: new Stroke({ color: SEARCH, width: 2, lineDash: [8, 6] }),
      }),
      new Style({
        geometry: new LineString([center, handle]),
        stroke: new Stroke({ color: SEARCH, width: 1.5 }),
      }),
      new Style({
        geometry: new MultiPoint([center, handle]),
        image: handleDot,
      }),
    ]
  }
}
