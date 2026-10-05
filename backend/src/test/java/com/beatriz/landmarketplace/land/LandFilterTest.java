package com.beatriz.landmarketplace.land;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class LandFilterTest {

	@Test
	void acceptsNoFiltersAtAll() {
		assertThatCode(() -> new LandFilter(null, null, null, null)).doesNotThrowAnyException();
	}

	@Test
	void acceptsEqualMinimumAndMaximum() {
		assertThatCode(() -> new LandFilter(new BigDecimal("100"), new BigDecimal("100.00"), 50.0, 50.0))
				.doesNotThrowAnyException();
	}

	@Test
	void rejectsNegativePrices() {
		assertInvalid(new BigDecimal("-1"), null, null, null, "minPrice and maxPrice must not be negative");
		assertInvalid(null, new BigDecimal("-0.01"), null, null, "minPrice and maxPrice must not be negative");
	}

	@Test
	void rejectsNegativeAreas() {
		assertInvalid(null, null, -1.0, null, "minArea and maxArea must not be negative");
		assertInvalid(null, null, null, Double.NaN, "minArea and maxArea must not be negative");
	}

	@Test
	void rejectsMinimumPriceGreaterThanMaximum() {
		assertInvalid(new BigDecimal("200"), new BigDecimal("100"), null, null,
				"minPrice must not be greater than maxPrice");
	}

	@Test
	void rejectsMinimumAreaGreaterThanMaximum() {
		assertInvalid(null, null, 200.0, 100.0, "minArea must not be greater than maxArea");
	}

	private static void assertInvalid(BigDecimal minPrice, BigDecimal maxPrice, Double minArea, Double maxArea,
			String message) {
		assertThatThrownBy(() -> new LandFilter(minPrice, maxPrice, minArea, maxArea))
				.isInstanceOf(InvalidSearchException.class)
				.hasMessage(message);
	}

}
