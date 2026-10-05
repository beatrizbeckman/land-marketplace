package com.beatriz.landmarketplace.land;

import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;

final class TestPolygons {

	private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

	private TestPolygons() {
	}

	static Polygon rectangle(double minLon, double minLat, double maxLon, double maxLat) {
		return GEOMETRY_FACTORY.createPolygon(new Coordinate[] {
				new Coordinate(minLon, minLat),
				new Coordinate(maxLon, minLat),
				new Coordinate(maxLon, maxLat),
				new Coordinate(minLon, maxLat),
				new Coordinate(minLon, minLat) });
	}

	static GeoJsonPolygon geoJsonRectangle(double minLon, double minLat, double maxLon, double maxLat) {
		return new GeoJsonPolygon("Polygon", List.of(List.of(
				List.of(minLon, minLat),
				List.of(maxLon, minLat),
				List.of(maxLon, maxLat),
				List.of(minLon, maxLat),
				List.of(minLon, minLat))));
	}

}
