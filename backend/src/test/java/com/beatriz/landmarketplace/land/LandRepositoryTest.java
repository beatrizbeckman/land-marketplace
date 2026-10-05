package com.beatriz.landmarketplace.land;

import static com.beatriz.landmarketplace.land.TestPolygons.rectangle;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.withinPercentage;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import com.beatriz.landmarketplace.TestcontainersConfiguration;
import com.beatriz.landmarketplace.auth.User;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
class LandRepositoryTest {

	private static final Polygon EXISTING = rectangle(-47.000, -15.000, -46.998, -14.998);

	// About 11,900 m2 and 47,600 m2 at this latitude.
	private static final Polygon SMALL = rectangle(-47.005, -15.005, -47.004, -15.004);
	private static final Polygon LARGE = rectangle(-47.000, -15.000, -46.998, -14.998);

	@Autowired
	private LandRepository landRepository;

	@Autowired
	private TestEntityManager entityManager;

	private Long ownerId;

	@BeforeEach
	void createOwner() {
		ownerId = entityManager.persistAndFlush(new User("Owner", "owner@example.com", "not-a-real-hash")).getId();
	}

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
		assertThat(found.getOwnerId()).isEqualTo(ownerId);
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

		List<Land> found = landRepository.findIntersectingBoundingBox(-47.010, -15.010, -46.990, -14.990,
				null, null, null, null);

		assertThat(found).extracting(Land::getId).containsExactly(inside.getId(), crossingTheEdge.getId());
	}

	@Test
	void findsNothingInAnEmptyBoundingBox() {
		save(EXISTING);

		assertThat(landRepository.findIntersectingBoundingBox(-40.0, -10.0, -39.0, -9.0,
				null, null, null, null)).isEmpty();
	}

	// The center is 0.001 degrees west of EXISTING, about 107.5 m at this latitude.
	@Test
	void findsLandWhenTheCircleReachesOnlyItsBorder() {
		Land land = save(EXISTING);

		List<Land> found = landRepository.findWithinRadius(-47.001, -14.999, 110, null, null, null, null);

		assertThat(found).extracting(Land::getId).containsExactly(land.getId());
	}

	@Test
	void findsNothingWhenTheCircleStopsShortOfTheLand() {
		save(EXISTING);

		assertThat(landRepository.findWithinRadius(-47.001, -14.999, 100, null, null, null, null)).isEmpty();
	}

	@Test
	void findsLandThatContainsTheWholeCircle() {
		Land land = save(EXISTING);

		List<Land> found = landRepository.findWithinRadius(-46.999, -14.999, 10, null, null, null, null);

		assertThat(found).extracting(Land::getId).containsExactly(land.getId());
	}

	@Test
	void filtersBoundingBoxResultsByPrice() {
		save(SMALL, "90000.00");
		Land expensive = save(LARGE, "150000.00");

		assertThat(inBoundingBox(new BigDecimal("100000"), null, null, null))
				.extracting(Land::getId).containsExactly(expensive.getId());
		assertThat(inBoundingBox(new BigDecimal("150000.00"), new BigDecimal("150000.00"), null, null))
				.extracting(Land::getId).containsExactly(expensive.getId());
		assertThat(inBoundingBox(null, new BigDecimal("50000"), null, null)).isEmpty();
	}

	@Test
	void filtersBoundingBoxResultsByArea() {
		Land small = save(SMALL, "90000.00");
		Land large = save(LARGE, "150000.00");

		assertThat(inBoundingBox(null, null, 20_000.0, null)).extracting(Land::getId).containsExactly(large.getId());
		assertThat(inBoundingBox(null, null, null, 20_000.0)).extracting(Land::getId).containsExactly(small.getId());
		assertThat(inBoundingBox(null, null, 10_000.0, 50_000.0)).hasSize(2);
	}

	@Test
	void filtersRadiusResultsByPrice() {
		Land cheap = save(SMALL, "90000.00");
		Land expensive = save(LARGE, "150000.00");

		assertThat(inRadius(null, new BigDecimal("100000"), null, null))
				.extracting(Land::getId).containsExactly(cheap.getId());
		assertThat(inRadius(new BigDecimal("100000"), null, null, null))
				.extracting(Land::getId).containsExactly(expensive.getId());
	}

	@Test
	void filtersRadiusResultsByArea() {
		Land small = save(SMALL, "90000.00");
		Land large = save(LARGE, "150000.00");

		assertThat(inRadius(null, null, null, 20_000.0)).extracting(Land::getId).containsExactly(small.getId());
		assertThat(inRadius(null, null, 20_000.0, null)).extracting(Land::getId).containsExactly(large.getId());
	}

	@Test
	void combinesPriceAndAreaFilters() {
		save(SMALL, "90000.00");
		save(LARGE, "150000.00");

		assertThat(inRadius(new BigDecimal("100000"), null, null, 20_000.0)).isEmpty();
	}

	private List<Land> inBoundingBox(BigDecimal minPrice, BigDecimal maxPrice, Double minArea, Double maxArea) {
		return landRepository.findIntersectingBoundingBox(-47.010, -15.010, -46.990, -14.990,
				minPrice, maxPrice, minArea, maxArea);
	}

	private List<Land> inRadius(BigDecimal minPrice, BigDecimal maxPrice, Double minArea, Double maxArea) {
		return landRepository.findWithinRadius(-47.000, -15.000, 2_000, minPrice, maxPrice, minArea, maxArea);
	}

	private Land save(Polygon polygon) {
		return save(polygon, "150000.50");
	}

	private Land save(Polygon polygon, String price) {
		return landRepository.saveAndFlush(new Land(polygon, new BigDecimal(price),
				"Flat plot close to the main road", "owner@example.com", ownerId));
	}

}
