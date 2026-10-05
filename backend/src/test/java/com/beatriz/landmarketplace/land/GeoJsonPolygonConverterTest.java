package com.beatriz.landmarketplace.land;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

	@Test
	void rejectsOtherGeometryTypes() {
		assertInvalid(new GeoJsonPolygon("LineString", List.of(OUTER_RING)), "geometry type must be Polygon");
	}

	@Test
	void rejectsMissingCoordinates() {
		assertInvalid(new GeoJsonPolygon("Polygon", null), "geometry must have at least one ring");
		assertInvalid(new GeoJsonPolygon("Polygon", List.of()), "geometry must have at least one ring");
	}

	@Test
	void rejectsRingWithFewerThanFourPositions() {
		List<List<Double>> ring = List.of(List.of(-47.0, -15.0), List.of(-46.99, -15.0), List.of(-47.0, -15.0));

		assertInvalid(polygonWith(ring), "each ring must have at least 4 positions");
	}

	@Test
	void rejectsOpenRing() {
		List<List<Double>> ring = List.of(
				List.of(-47.0, -15.0),
				List.of(-46.99, -15.0),
				List.of(-46.99, -14.99),
				List.of(-47.0, -14.99));

		assertInvalid(polygonWith(ring), "each ring must be closed: first and last positions must be equal");
	}

	@Test
	void rejectsSelfIntersectingRing() {
		List<List<Double>> bowTie = List.of(
				List.of(-47.0, -15.0),
				List.of(-46.99, -14.99),
				List.of(-46.99, -15.0),
				List.of(-47.0, -14.99),
				List.of(-47.0, -15.0));

		assertInvalid(polygonWith(bowTie), "geometry must be a valid polygon without self-intersections");
	}

	@Test
	void rejectsPositionWithoutLongitudeAndLatitude() {
		List<List<Double>> ring = List.of(
				List.of(-47.0),
				List.of(-46.99, -15.0),
				List.of(-46.99, -14.99),
				List.of(-47.0));

		assertInvalid(polygonWith(ring), "each position must be [longitude, latitude]");
	}

	@Test
	void rejectsLongitudeOutOfRange() {
		List<List<Double>> ring = List.of(
				List.of(180.5, -15.0),
				List.of(-46.99, -15.0),
				List.of(-46.99, -14.99),
				List.of(180.5, -15.0));

		assertInvalid(polygonWith(ring), "longitude must be between -180 and 180");
	}

	@Test
	void rejectsLatitudeOutOfRange() {
		List<List<Double>> ring = List.of(
				List.of(-47.0, -90.5),
				List.of(-46.99, -15.0),
				List.of(-46.99, -14.99),
				List.of(-47.0, -90.5));

		assertInvalid(polygonWith(ring), "latitude must be between -90 and 90");
	}

	private static GeoJsonPolygon polygonWith(List<List<Double>> ring) {
		return new GeoJsonPolygon("Polygon", List.of(ring));
	}

	private void assertInvalid(GeoJsonPolygon geoJson, String message) {
		assertThatThrownBy(() -> converter.toPolygon(geoJson))
				.isInstanceOf(InvalidGeometryException.class)
				.hasMessage(message);
	}

}
