/** Axis-aligned square of `side` degrees with the south-west corner at (lon, lat). */
export function squarePolygon(lon, lat, side = 0.001) {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lon, lat],
        [lon + side, lat],
        [lon + side, lat + side],
        [lon, lat + side],
        [lon, lat],
      ],
    ],
  }
}

export function makeLand(
  id,
  overrides = {},
) {
  const { lon = 0, lat = 0, side = 0.001, ...properties } = overrides
  return {
    type: 'Feature',
    geometry: squarePolygon(lon, lat, side),
    properties: {
      id,
      price: 185_000,
      description: 'Flat land close to the river, ready to build.',
      contact: 'owner@example.com',
      areaSqm: 12_300,
      ownedByMe: false,
      ...properties,
    },
  }
}

export function makeCollection(lands) {
  return { type: 'FeatureCollection', features: lands }
}
