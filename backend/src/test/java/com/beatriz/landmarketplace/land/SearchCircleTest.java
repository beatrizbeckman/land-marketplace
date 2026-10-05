package com.beatriz.landmarketplace.land;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SearchCircleTest {

	@Test
	void acceptsCenterOnTheEdgeOfTheValidRange() {
		assertThatCode(() -> new SearchCircle(180, -90, 0.5)).doesNotThrowAnyException();
	}

	@ParameterizedTest
	@ValueSource(doubles = { -180.1, 180.1, Double.NaN })
	void rejectsLongitudeOutOfRange(double lon) {
		assertThatThrownBy(() -> new SearchCircle(lon, -15, 100))
				.isInstanceOf(InvalidSearchException.class)
				.hasMessage("lon must be between -180 and 180");
	}

	@ParameterizedTest
	@ValueSource(doubles = { -90.1, 90.1, Double.NaN })
	void rejectsLatitudeOutOfRange(double lat) {
		assertThatThrownBy(() -> new SearchCircle(-47, lat, 100))
				.isInstanceOf(InvalidSearchException.class)
				.hasMessage("lat must be between -90 and 90");
	}

	@ParameterizedTest
	@ValueSource(doubles = { 0, -5, Double.NaN, Double.POSITIVE_INFINITY })
	void rejectsRadiusThatIsNotPositive(double radius) {
		assertThatThrownBy(() -> new SearchCircle(-47, -15, radius))
				.isInstanceOf(InvalidSearchException.class)
				.hasMessage("radius must be greater than zero");
	}

}
