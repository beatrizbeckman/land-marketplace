package com.beatriz.landmarketplace.land;

import java.util.List;

import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LandService {

	private final LandRepository landRepository;
	private final GeoJsonPolygonConverter converter;

	LandService(LandRepository landRepository, GeoJsonPolygonConverter converter) {
		this.landRepository = landRepository;
		this.converter = converter;
	}

	@Transactional
	public LandFeature register(CreateLandRequest request) {
		Polygon polygon = converter.toPolygon(request.geometry());

		landRepository.lockRegistrations();
		if (landRepository.existsOverlapping(polygon)) {
			throw new LandOverlapException();
		}

		CreateLandRequest.Properties properties = request.properties();
		Land land = landRepository.save(
				new Land(polygon, properties.price(), properties.description(), properties.contact()));
		return toFeature(land);
	}

	@Transactional(readOnly = true)
	public LandFeatureCollection findInBoundingBox(BoundingBox box, LandFilter filter) {
		return toFeatureCollection(landRepository.findIntersectingBoundingBox(
				box.minLon(), box.minLat(), box.maxLon(), box.maxLat(),
				filter.minPrice(), filter.maxPrice(), filter.minArea(), filter.maxArea()));
	}

	@Transactional(readOnly = true)
	public LandFeatureCollection findInCircle(SearchCircle circle, LandFilter filter) {
		return toFeatureCollection(landRepository.findWithinRadius(
				circle.lon(), circle.lat(), circle.radiusInMeters(),
				filter.minPrice(), filter.maxPrice(), filter.minArea(), filter.maxArea()));
	}

	private LandFeatureCollection toFeatureCollection(List<Land> lands) {
		return LandFeatureCollection.of(lands.stream().map(this::toFeature).toList());
	}

	private LandFeature toFeature(Land land) {
		return LandFeature.of(land, converter.toGeoJson(land.getGeometry()));
	}

}
