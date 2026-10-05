package com.beatriz.landmarketplace.land;

import java.math.BigDecimal;

public record LandFeature(String type, GeoJsonPolygon geometry, Properties properties) {

	public record Properties(Long id, BigDecimal price, String description, String contact, Double areaSqm) {
	}

	static LandFeature of(Land land, GeoJsonPolygon geometry) {
		return new LandFeature("Feature", geometry, new Properties(land.getId(), land.getPrice(),
				land.getDescription(), land.getContact(), land.getAreaSqm()));
	}

}
