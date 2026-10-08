import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'

export const BASE_LAYERS = [
  {
    key: 'satellite',
    label: 'Satellite',
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
    thumbnailUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/19/11',
  },
  {
    key: 'terrain',
    label: 'Terrain',
    attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)',
    thumbnailUrl: 'https://a.tile.opentopomap.org/5/11/19.png',
  },
  {
    key: 'streets',
    label: 'Streets',
    attribution: '© OpenStreetMap contributors',
    thumbnailUrl: 'https://tile.openstreetmap.org/5/11/19.png',
  },
]

export const DEFAULT_BASE_LAYER = 'satellite'

/** One tile layer per option; switching just toggles visibility (no reload). */
export function createBaseLayers() {
  const satellite = new TileLayer({
    visible: true,
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
    }),
  })
  const terrain = new TileLayer({
    visible: false,
    source: new XYZ({
      url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
      maxZoom: 17,
    }),
  })
  const streets = new TileLayer({
    visible: false,
    source: new OSM(),
  })

  satellite.set('baseKey', 'satellite')
  terrain.set('baseKey', 'terrain')
  streets.set('baseKey', 'streets')
  return [satellite, terrain, streets]
}
