package com.beatriz.landmarketplace.land;

import java.util.List;

public record GeoJsonPolygon(String type, List<List<List<Double>>> coordinates) {
}
