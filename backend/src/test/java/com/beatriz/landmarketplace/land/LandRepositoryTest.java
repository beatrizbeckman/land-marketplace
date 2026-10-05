package com.beatriz.landmarketplace.land;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.withinPercentage;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import com.beatriz.landmarketplace.TestcontainersConfiguration;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
class LandRepositoryTest {

	private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

	@Autowired
	private LandRepository landRepository;

	@Autowired
	private TestEntityManager entityManager;

	@Test
	void savesPolygonAndReadsItBackWithAreaComputedByTheDatabase() {
		Polygon square = square(-47.0, -15.0, 0.001);
		Land land = new Land(square, new BigDecimal("150000.50"), "Flat plot close to the main road",
				"owner@example.com");

		Long id = landRepository.saveAndFlush(land).getId();
		entityManager.clear();

		Land found = landRepository.findById(id).orElseThrow();
		assertThat(found.getGeometry().equalsTopo(square)).isTrue();
		assertThat(found.getGeometry().getSRID()).isEqualTo(4326);
		assertThat(found.getPrice()).isEqualByComparingTo("150000.50");
		assertThat(found.getDescription()).isEqualTo("Flat plot close to the main road");
		assertThat(found.getContact()).isEqualTo("owner@example.com");
		// 0.001 degrees at latitude -15 is about 107.5 m east-west by 110.7 m north-south.
		assertThat(found.getAreaSqm()).isCloseTo(11_900.0, withinPercentage(1));
	}

	private static Polygon square(double minLon, double minLat, double sideInDegrees) {
		double maxLon = minLon + sideInDegrees;
		double maxLat = minLat + sideInDegrees;
		return GEOMETRY_FACTORY.createPolygon(new Coordinate[] {
				new Coordinate(minLon, minLat),
				new Coordinate(maxLon, minLat),
				new Coordinate(maxLon, maxLat),
				new Coordinate(minLon, maxLat),
				new Coordinate(minLon, minLat) });
	}

}
