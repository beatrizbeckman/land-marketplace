package com.beatriz.landmarketplace.land;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Component;

@Component
class GeoJsonPolygonConverter {

	private static final String POLYGON_TYPE = "Polygon";

	// GeoJSON coordinates are always WGS 84 longitude/latitude, the same SRID as the geom column.
	private static final int SRID = 4326;

	// A closed ring needs three distinct vertices plus the repeated first one.
	private static final int MIN_RING_POSITIONS = 4;

	private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), SRID);

	Polygon toPolygon(GeoJsonPolygon geoJson) {
		if (!POLYGON_TYPE.equals(geoJson.type())) {
			throw new InvalidGeometryException("geometry type must be Polygon");
		}
		if (geoJson.coordinates() == null || geoJson.coordinates().isEmpty()) {
			throw new InvalidGeometryException("geometry must have at least one ring");
		}
		List<LinearRing> rings = geoJson.coordinates().stream().map(this::toLinearRing).toList();
		LinearRing shell = rings.getFirst();
		LinearRing[] holes = rings.subList(1, rings.size()).toArray(LinearRing[]::new);
		Polygon polygon = geometryFactory.createPolygon(shell, holes);
		if (!polygon.isValid()) {
			throw new InvalidGeometryException("geometry must be a valid polygon without self-intersections");
		}
		return polygon;
	}

	GeoJsonPolygon toGeoJson(Polygon polygon) {
		List<List<List<Double>>> rings = new ArrayList<>();
		rings.add(toPositions(polygon.getExteriorRing()));
		for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
			rings.add(toPositions(polygon.getInteriorRingN(i)));
		}
		return new GeoJsonPolygon(POLYGON_TYPE, rings);
	}

	private LinearRing toLinearRing(List<List<Double>> positions) {
		if (positions == null || positions.size() < MIN_RING_POSITIONS) {
			throw new InvalidGeometryException("each ring must have at least 4 positions");
		}
		Coordinate[] coordinates = positions.stream().map(this::toCoordinate).toArray(Coordinate[]::new);
		if (!coordinates[0].equals2D(coordinates[coordinates.length - 1])) {
			throw new InvalidGeometryException("each ring must be closed: first and last positions must be equal");
		}
		return geometryFactory.createLinearRing(coordinates);
	}

	private Coordinate toCoordinate(List<Double> position) {
		if (position == null || position.size() < 2 || position.get(0) == null || position.get(1) == null) {
			throw new InvalidGeometryException("each position must be [longitude, latitude]");
		}
		double longitude = position.get(0);
		double latitude = position.get(1);
		if (longitude < -180 || longitude > 180) {
			throw new InvalidGeometryException("longitude must be between -180 and 180");
		}
		if (latitude < -90 || latitude > 90) {
			throw new InvalidGeometryException("latitude must be between -90 and 90");
		}
		return new Coordinate(longitude, latitude);
	}

	private List<List<Double>> toPositions(LinearRing ring) {
		return Arrays.stream(ring.getCoordinates())
				.map(coordinate -> List.of(coordinate.getX(), coordinate.getY()))
				.toList();
	}

}
