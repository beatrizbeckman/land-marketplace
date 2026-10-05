package com.beatriz.landmarketplace.land;

import java.math.BigDecimal;

record LandFilter(BigDecimal minPrice, BigDecimal maxPrice, Double minArea, Double maxArea) {

	LandFilter {
		if (isNegative(minPrice) || isNegative(maxPrice)) {
			throw new InvalidSearchException("minPrice and maxPrice must not be negative");
		}
		if (isNegative(minArea) || isNegative(maxArea)) {
			throw new InvalidSearchException("minArea and maxArea must not be negative");
		}
		if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
			throw new InvalidSearchException("minPrice must not be greater than maxPrice");
		}
		if (minArea != null && maxArea != null && minArea > maxArea) {
			throw new InvalidSearchException("minArea must not be greater than maxArea");
		}
	}

	private static boolean isNegative(BigDecimal value) {
		return value != null && value.signum() < 0;
	}

	private static boolean isNegative(Double value) {
		return value != null && !(value >= 0);
	}

}
