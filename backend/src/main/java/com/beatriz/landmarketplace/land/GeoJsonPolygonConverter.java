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

	private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), SRID);

	Polygon toPolygon(GeoJsonPolygon geoJson) {
		List<LinearRing> rings = geoJson.coordinates().stream().map(this::toLinearRing).toList();
		LinearRing shell = rings.getFirst();
		LinearRing[] holes = rings.subList(1, rings.size()).toArray(LinearRing[]::new);
		return geometryFactory.createPolygon(shell, holes);
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
		Coordinate[] coordinates = positions.stream()
				.map(position -> new Coordinate(position.get(0), position.get(1)))
				.toArray(Coordinate[]::new);
		return geometryFactory.createLinearRing(coordinates);
	}

	private List<List<Double>> toPositions(LinearRing ring) {
		return Arrays.stream(ring.getCoordinates())
				.map(coordinate -> List.of(coordinate.getX(), coordinate.getY()))
				.toList();
	}

}
