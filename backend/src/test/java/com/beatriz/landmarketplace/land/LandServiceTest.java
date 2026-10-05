package com.beatriz.landmarketplace.land;

import static com.beatriz.landmarketplace.land.TestPolygons.geoJsonRectangle;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.locationtech.jts.geom.Polygon;

@ExtendWith(MockitoExtension.class)
class LandServiceTest {

	private static final GeoJsonPolygon GEOMETRY = geoJsonRectangle(-47.000, -15.000, -46.998, -14.998);

	@Mock
	private LandRepository landRepository;

	private LandService landService;

	@BeforeEach
	void setUp() {
		landService = new LandService(landRepository, new GeoJsonPolygonConverter());
	}

	@Test
	void registersLandWhenNothingOverlaps() {
		when(landRepository.existsOverlapping(any(Polygon.class))).thenReturn(false);
		when(landRepository.save(any(Land.class))).then(returnsFirstArg());

		LandFeature feature = landService.register(request(GEOMETRY));

		assertThat(feature.type()).isEqualTo("Feature");
		assertThat(feature.geometry()).isEqualTo(GEOMETRY);
		assertThat(feature.properties().price()).isEqualByComparingTo("150000.50");
		assertThat(feature.properties().description()).isEqualTo("Flat plot close to the main road");
		assertThat(feature.properties().contact()).isEqualTo("owner@example.com");
	}

	@Test
	void takesTheRegistrationLockBeforeCheckingOverlapAndSaving() {
		when(landRepository.save(any(Land.class))).then(returnsFirstArg());

		landService.register(request(GEOMETRY));

		InOrder inOrder = inOrder(landRepository);
		inOrder.verify(landRepository).lockRegistrations();
		inOrder.verify(landRepository).existsOverlapping(any(Polygon.class));
		inOrder.verify(landRepository).save(any(Land.class));
	}

	@Test
	void rejectsLandThatOverlapsAnExistingOne() {
		when(landRepository.existsOverlapping(any(Polygon.class))).thenReturn(true);

		assertThatThrownBy(() -> landService.register(request(GEOMETRY)))
				.isInstanceOf(LandOverlapException.class);

		verify(landRepository, never()).save(any(Land.class));
	}

	@Test
	void rejectsInvalidGeometryWithoutTouchingTheDatabase() {
		GeoJsonPolygon point = new GeoJsonPolygon("Point", List.of());

		assertThatThrownBy(() -> landService.register(request(point)))
				.isInstanceOf(InvalidGeometryException.class);

		verifyNoInteractions(landRepository);
	}

	private static CreateLandRequest request(GeoJsonPolygon geometry) {
		return new CreateLandRequest(geometry, new CreateLandRequest.Properties(new BigDecimal("150000.50"),
				"Flat plot close to the main road", "owner@example.com"));
	}

}
