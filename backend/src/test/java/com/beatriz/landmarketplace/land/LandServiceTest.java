package com.beatriz.landmarketplace.land;

import static com.beatriz.landmarketplace.land.TestPolygons.geoJsonRectangle;
import static com.beatriz.landmarketplace.land.TestPolygons.rectangle;
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
import org.locationtech.jts.geom.Polygon;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LandServiceTest {

	private static final GeoJsonPolygon GEOMETRY = geoJsonRectangle(-47.000, -15.000, -46.998, -14.998);
	private static final LandFilter NO_FILTER = new LandFilter(null, null, null, null);
	private static final BoundingBox BOX = new BoundingBox(-47.5, -15.5, -46.5, -14.5);
	private static final SearchCircle CIRCLE = new SearchCircle(-47.0, -15.0, 250.0);
	private static final Long OWNER_ID = 42L;
	private static final Long OTHER_USER_ID = 7L;

	@Mock
	private LandRepository landRepository;

	private LandService landService;

	@BeforeEach
	void setUp() {
		landService = new LandService(landRepository, new GeoJsonPolygonConverter());
	}

	@Test
	void registersLandForTheAuthenticatedUserWhenNothingOverlaps() {
		when(landRepository.existsOverlapping(any(Polygon.class))).thenReturn(false);
		when(landRepository.save(any(Land.class))).then(returnsFirstArg());

		LandFeature feature = landService.register(request(GEOMETRY), OWNER_ID);

		ArgumentCaptor<Land> saved = ArgumentCaptor.forClass(Land.class);
		verify(landRepository).save(saved.capture());
		assertThat(saved.getValue().getOwnerId()).isEqualTo(OWNER_ID);
		assertThat(feature.type()).isEqualTo("Feature");
		assertThat(feature.geometry()).isEqualTo(GEOMETRY);
		assertThat(feature.properties().price()).isEqualByComparingTo("150000.50");
		assertThat(feature.properties().description()).isEqualTo("Flat plot close to the main road");
		assertThat(feature.properties().contact()).isEqualTo("owner@example.com");
		assertThat(feature.properties().ownedByMe()).isTrue();
	}

	@Test
	void takesTheRegistrationLockBeforeCheckingOverlapAndSaving() {
		when(landRepository.save(any(Land.class))).then(returnsFirstArg());

		landService.register(request(GEOMETRY), OWNER_ID);

		InOrder inOrder = inOrder(landRepository);
		inOrder.verify(landRepository).lockRegistrations();
		inOrder.verify(landRepository).existsOverlapping(any(Polygon.class));
		inOrder.verify(landRepository).save(any(Land.class));
	}

	@Test
	void rejectsLandThatOverlapsAnExistingOne() {
		when(landRepository.existsOverlapping(any(Polygon.class))).thenReturn(true);

		assertThatThrownBy(() -> landService.register(request(GEOMETRY), OWNER_ID))
				.isInstanceOf(LandOverlapException.class);

		verify(landRepository, never()).save(any(Land.class));
	}

	@Test
	void rejectsInvalidGeometryWithoutTouchingTheDatabase() {
		GeoJsonPolygon point = new GeoJsonPolygon("Point", List.of());

		assertThatThrownBy(() -> landService.register(request(point), OWNER_ID))
				.isInstanceOf(InvalidGeometryException.class);

		verifyNoInteractions(landRepository);
	}

	@Test
	void returnsLandsInTheBoundingBoxAsFeatureCollection() {
		when(landRepository.findIntersectingBoundingBox(-47.5, -15.5, -46.5, -14.5, null, null, null, null))
				.thenReturn(List.of(land()));

		LandFeatureCollection collection = landService.findInBoundingBox(BOX, NO_FILTER, null);

		assertThat(collection.type()).isEqualTo("FeatureCollection");
		assertThat(collection.features()).singleElement()
				.satisfies(feature -> assertThat(feature.geometry()).isEqualTo(GEOMETRY));
	}

	@Test
	void returnsLandsInTheCircleAsFeatureCollection() {
		when(landRepository.findWithinRadius(-47.0, -15.0, 250.0, null, null, null, null)).thenReturn(List.of(land()));

		LandFeatureCollection collection = landService.findInCircle(CIRCLE, NO_FILTER, null);

		assertThat(collection.features()).singleElement()
				.satisfies(feature -> assertThat(feature.properties().contact()).isEqualTo("owner@example.com"));
	}

	@Test
	void returnsEmptyFeatureCollectionWhenNothingIsFound() {
		LandFeatureCollection collection = landService.findInCircle(CIRCLE, NO_FILTER, null);

		assertThat(collection.type()).isEqualTo("FeatureCollection");
		assertThat(collection.features()).isEmpty();
	}

	@Test
	void passesTheFiltersToBothQueries() {
		LandFilter filter = new LandFilter(new BigDecimal("1000"), new BigDecimal("2000"), 300.0, 400.0);

		landService.findInBoundingBox(BOX, filter, null);
		landService.findInCircle(CIRCLE, filter, null);

		verify(landRepository).findIntersectingBoundingBox(-47.5, -15.5, -46.5, -14.5,
				new BigDecimal("1000"), new BigDecimal("2000"), 300.0, 400.0);
		verify(landRepository).findWithinRadius(-47.0, -15.0, 250.0,
				new BigDecimal("1000"), new BigDecimal("2000"), 300.0, 400.0);
	}

	@Test
	void marksLandsOwnedByTheCurrentUser() {
		when(landRepository.findIntersectingBoundingBox(-47.5, -15.5, -46.5, -14.5, null, null, null, null))
				.thenReturn(List.of(land()));

		assertThat(ownedByMe(landService.findInBoundingBox(BOX, NO_FILTER, OWNER_ID))).isTrue();
		assertThat(ownedByMe(landService.findInBoundingBox(BOX, NO_FILTER, OTHER_USER_ID))).isFalse();
	}

	@Test
	void neverMarksLandsAsOwnedForAnonymousRequests() {
		when(landRepository.findWithinRadius(-47.0, -15.0, 250.0, null, null, null, null)).thenReturn(List.of(land()));

		assertThat(ownedByMe(landService.findInCircle(CIRCLE, NO_FILTER, null))).isFalse();
	}

	private static boolean ownedByMe(LandFeatureCollection collection) {
		return collection.features().getFirst().properties().ownedByMe();
	}

	private static Land land() {
		return new Land(rectangle(-47.000, -15.000, -46.998, -14.998), new BigDecimal("150000.50"),
				"Flat plot close to the main road", "owner@example.com", OWNER_ID);
	}

	private static CreateLandRequest request(GeoJsonPolygon geometry) {
		return new CreateLandRequest(geometry, new CreateLandRequest.Properties(new BigDecimal("150000.50"),
				"Flat plot close to the main road", "owner@example.com"));
	}

}
