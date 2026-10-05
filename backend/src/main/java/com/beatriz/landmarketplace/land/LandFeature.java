package com.beatriz.landmarketplace.land;

import java.math.BigDecimal;

public record LandFeature(String type, GeoJsonPolygon geometry, Properties properties) {

	public record Properties(Long id, BigDecimal price, String description, String contact, Double areaSqm,
			boolean ownedByMe) {
	}

	// currentUserId is null for anonymous requests, which never own anything.
	static LandFeature of(Land land, GeoJsonPolygon geometry, Long currentUserId) {
		return new LandFeature("Feature", geometry, new Properties(land.getId(), land.getPrice(),
				land.getDescription(), land.getContact(), land.getAreaSqm(),
				land.getOwnerId().equals(currentUserId)));
	}

}
