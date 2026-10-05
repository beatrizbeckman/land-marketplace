package com.beatriz.landmarketplace.land;

record BoundingBox(double minLon, double minLat, double maxLon, double maxLat) {

	// A map zoomed far out reports an extent wider than the world, so the box is clamped
	// to valid coordinates instead of being rejected.
	BoundingBox {
		minLon = Math.clamp(minLon, -180.0, 180.0);
		maxLon = Math.clamp(maxLon, -180.0, 180.0);
		minLat = Math.clamp(minLat, -90.0, 90.0);
		maxLat = Math.clamp(maxLat, -90.0, 90.0);
		if (!(minLon < maxLon && minLat < maxLat)) {
			throw new InvalidSearchAreaException("bbox minimums must be lower than its maximums");
		}
	}

	static BoundingBox parse(String bbox) {
		String[] parts = bbox.split(",");
		if (parts.length != 4) {
			throw new InvalidSearchAreaException("bbox must be minLon,minLat,maxLon,maxLat");
		}
		try {
			return new BoundingBox(Double.parseDouble(parts[0]), Double.parseDouble(parts[1]),
					Double.parseDouble(parts[2]), Double.parseDouble(parts[3]));
		}
		catch (NumberFormatException exception) {
			throw new InvalidSearchAreaException("bbox must be minLon,minLat,maxLon,maxLat");
		}
	}

}
