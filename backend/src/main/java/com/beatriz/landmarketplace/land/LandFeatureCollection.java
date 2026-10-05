package com.beatriz.landmarketplace.land;

import java.util.List;

public record LandFeatureCollection(String type, List<LandFeature> features) {

	static LandFeatureCollection of(List<LandFeature> features) {
		return new LandFeatureCollection("FeatureCollection", features);
	}

}
