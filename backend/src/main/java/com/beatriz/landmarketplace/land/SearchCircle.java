package com.beatriz.landmarketplace.land;

record SearchCircle(double lon, double lat, double radiusInMeters) {

	SearchCircle {
		if (!(lon >= -180 && lon <= 180)) {
			throw new InvalidSearchException("lon must be between -180 and 180");
		}
		if (!(lat >= -90 && lat <= 90)) {
			throw new InvalidSearchException("lat must be between -90 and 90");
		}
		if (!(radiusInMeters > 0) || Double.isInfinite(radiusInMeters)) {
			throw new InvalidSearchException("radius must be greater than zero");
		}
	}

}
