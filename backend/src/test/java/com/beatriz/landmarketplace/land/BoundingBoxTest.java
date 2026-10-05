package com.beatriz.landmarketplace.land;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class BoundingBoxTest {

	@Test
	void parsesMinLonMinLatMaxLonMaxLat() {
		assertThat(BoundingBox.parse("-47.5,-15.5,-46.5,-14.5"))
				.isEqualTo(new BoundingBox(-47.5, -15.5, -46.5, -14.5));
	}

	@Test
	void clampsBoxesLargerThanTheWorld() {
		assertThat(BoundingBox.parse("-540,-120,540,120")).isEqualTo(new BoundingBox(-180, -90, 180, 90));
	}

	@ParameterizedTest
	@ValueSource(strings = { "", "-47.5,-15.5,-46.5", "-47.5,-15.5,-46.5,-14.5,0", "west,-15.5,-46.5,-14.5" })
	void rejectsValuesThatAreNotFourNumbers(String bbox) {
		assertThatThrownBy(() -> BoundingBox.parse(bbox))
				.isInstanceOf(InvalidSearchAreaException.class)
				.hasMessage("bbox must be minLon,minLat,maxLon,maxLat");
	}

	@ParameterizedTest
	@ValueSource(strings = { "-46.5,-15.5,-47.5,-14.5", "-47.5,-14.5,-46.5,-15.5", "-47.5,-15.5,-47.5,-14.5",
			"NaN,-15.5,-46.5,-14.5" })
	void rejectsBoxesWithoutArea(String bbox) {
		assertThatThrownBy(() -> BoundingBox.parse(bbox))
				.isInstanceOf(InvalidSearchAreaException.class)
				.hasMessage("bbox minimums must be lower than its maximums");
	}

}
