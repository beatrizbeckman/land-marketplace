package com.beatriz.landmarketplace.land;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Polygon;

class GeoJsonPolygonConverterTest {

	private static final List<List<Double>> OUTER_RING = List.of(
			List.of(-47.0, -15.0),
			List.of(-46.99, -15.0),
			List.of(-46.99, -14.99),
			List.of(-47.0, -14.99),
			List.of(-47.0, -15.0));

	private static final List<List<Double>> HOLE = List.of(
			List.of(-46.996, -14.996),
			List.of(-46.994, -14.996),
			List.of(-46.994, -14.994),
			List.of(-46.996, -14.994),
			List.of(-46.996, -14.996));

	private final GeoJsonPolygonConverter converter = new GeoJsonPolygonConverter();

	@Test
	void readsPositionsAsLongitudeThenLatitude() {
		Polygon polygon = converter.toPolygon(new GeoJsonPolygon("Polygon", List.of(OUTER_RING)));

		assertThat(polygon.getExteriorRing().getCoordinateN(1)).isEqualTo(new Coordinate(-46.99, -15.0));
		assertThat(polygon.getNumPoints()).isEqualTo(5);
	}

	@Test
	void createsPolygonsWithSrid4326() {
		Polygon polygon = converter.toPolygon(new GeoJsonPolygon("Polygon", List.of(OUTER_RING)));

		assertThat(polygon.getSRID()).isEqualTo(4326);
	}

	@Test
	void convertsBackToTheSameGeoJson() {
		GeoJsonPolygon geoJson = new GeoJsonPolygon("Polygon", List.of(OUTER_RING));

		assertThat(converter.toGeoJson(converter.toPolygon(geoJson))).isEqualTo(geoJson);
	}

	@Test
	void keepsInteriorRingsInBothDirections() {
		GeoJsonPolygon geoJson = new GeoJsonPolygon("Polygon", List.of(OUTER_RING, HOLE));

		Polygon polygon = converter.toPolygon(geoJson);

		assertThat(polygon.getNumInteriorRing()).isEqualTo(1);
		assertThat(converter.toGeoJson(polygon)).isEqualTo(geoJson);
	}

}
