package com.beatriz.landmarketplace.land;

import static com.beatriz.landmarketplace.land.TestPolygons.rectangle;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.withinPercentage;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import com.beatriz.landmarketplace.TestcontainersConfiguration;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
class LandRepositoryTest {

	private static final Polygon EXISTING = rectangle(-47.000, -15.000, -46.998, -14.998);

	@Autowired
	private LandRepository landRepository;

	@Autowired
	private TestEntityManager entityManager;

	@Test
	void savesPolygonAndReadsItBackWithAreaComputedByTheDatabase() {
		Polygon square = rectangle(-47.000, -15.000, -46.999, -14.999);

		Long id = save(square).getId();
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

	@Test
	void detectsPartialOverlap() {
		save(EXISTING);

		assertThat(landRepository.existsOverlapping(rectangle(-46.999, -14.999, -46.997, -14.997))).isTrue();
	}

	@Test
	void detectsPolygonInsideAnExistingPlot() {
		save(EXISTING);

		assertThat(landRepository.existsOverlapping(rectangle(-46.9995, -14.9995, -46.9985, -14.9985))).isTrue();
	}

	@Test
	void detectsPolygonThatContainsAnExistingPlot() {
		save(EXISTING);

		assertThat(landRepository.existsOverlapping(rectangle(-47.001, -15.001, -46.997, -14.997))).isTrue();
	}

	@Test
	void detectsIdenticalPolygon() {
		save(EXISTING);

		assertThat(landRepository.existsOverlapping(rectangle(-47.000, -15.000, -46.998, -14.998))).isTrue();
	}

	@Test
	void allowsPolygonThatSharesOnlyABorder() {
		save(EXISTING);

		assertThat(landRepository.existsOverlapping(rectangle(-46.998, -15.000, -46.996, -14.998))).isFalse();
	}

	@Test
	void allowsPolygonThatSharesOnlyAVertex() {
		save(EXISTING);

		assertThat(landRepository.existsOverlapping(rectangle(-46.998, -14.998, -46.996, -14.996))).isFalse();
	}

	@Test
	void allowsDistantPolygon() {
		save(EXISTING);

		assertThat(landRepository.existsOverlapping(rectangle(-46.900, -15.000, -46.898, -14.998))).isFalse();
	}

	@Test
	void findsOnlyLandsIntersectingTheBoundingBox() {
		Land inside = save(rectangle(-47.000, -15.000, -46.998, -14.998));
		Land crossingTheEdge = save(rectangle(-46.991, -15.000, -46.989, -14.998));
		save(rectangle(-46.900, -15.000, -46.898, -14.998));

		List<Land> found = landRepository.findIntersectingBoundingBox(-47.010, -15.010, -46.990, -14.990);

		assertThat(found).extracting(Land::getId).containsExactly(inside.getId(), crossingTheEdge.getId());
	}

	@Test
	void findsNothingInAnEmptyBoundingBox() {
		save(EXISTING);

		assertThat(landRepository.findIntersectingBoundingBox(-40.0, -10.0, -39.0, -9.0)).isEmpty();
	}

	// The center is 0.001 degrees west of EXISTING, about 107.5 m at this latitude.
	@Test
	void findsLandWhenTheCircleReachesOnlyItsBorder() {
		Land land = save(EXISTING);

		List<Land> found = landRepository.findWithinRadius(-47.001, -14.999, 110);

		assertThat(found).extracting(Land::getId).containsExactly(land.getId());
	}

	@Test
	void findsNothingWhenTheCircleStopsShortOfTheLand() {
		save(EXISTING);

		assertThat(landRepository.findWithinRadius(-47.001, -14.999, 100)).isEmpty();
	}

	@Test
	void findsLandThatContainsTheWholeCircle() {
		Land land = save(EXISTING);

		List<Land> found = landRepository.findWithinRadius(-46.999, -14.999, 10);

		assertThat(found).extracting(Land::getId).containsExactly(land.getId());
	}

	private Land save(Polygon polygon) {
		return landRepository.saveAndFlush(new Land(polygon, new BigDecimal("150000.50"),
				"Flat plot close to the main road", "owner@example.com"));
	}

}
