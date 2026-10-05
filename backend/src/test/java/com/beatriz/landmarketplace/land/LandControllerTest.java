package com.beatriz.landmarketplace.land;

import static com.beatriz.landmarketplace.land.TestPolygons.geoJsonRectangle;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@WebMvcTest(LandController.class)
class LandControllerTest {

	private static final String VALID_FEATURE = """
			{
			  "type": "Feature",
			  "geometry": {
			    "type": "Polygon",
			    "coordinates": [[[-47.0, -15.0], [-46.998, -15.0], [-46.998, -14.998], [-47.0, -14.998], [-47.0, -15.0]]]
			  },
			  "properties": {
			    "price": 150000.50,
			    "description": "Flat plot close to the main road",
			    "contact": "owner@example.com"
			  }
			}
			""";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private LandService landService;

	@Test
	void returnsCreatedFeature() throws Exception {
		GeoJsonPolygon geometry = geoJsonRectangle(-47.0, -15.0, -46.998, -14.998);
		when(landService.register(any())).thenReturn(new LandFeature("Feature", geometry,
				new LandFeature.Properties(7L, new BigDecimal("150000.50"), "Flat plot close to the main road",
						"owner@example.com", 47_600.25)));

		postLand(VALID_FEATURE)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("Feature"))
				.andExpect(jsonPath("$.geometry.type").value("Polygon"))
				.andExpect(jsonPath("$.geometry.coordinates[0][1][0]").value(-46.998))
				.andExpect(jsonPath("$.properties.id").value(7))
				.andExpect(jsonPath("$.properties.price").value(150000.50))
				.andExpect(jsonPath("$.properties.description").value("Flat plot close to the main road"))
				.andExpect(jsonPath("$.properties.contact").value("owner@example.com"))
				.andExpect(jsonPath("$.properties.areaSqm").value(47_600.25));
	}

	@Test
	void acceptsPhoneNumberAsContact() throws Exception {
		postLand(VALID_FEATURE.replace("owner@example.com", "+55 (61) 99999-0000"))
				.andExpect(status().isCreated());
	}

	@Test
	void reportsEachInvalidFieldAsProblemDetails() throws Exception {
		String body = """
				{
				  "type": "Feature",
				  "geometry": null,
				  "properties": { "price": -1, "description": "Too short", "contact": "not a contact" }
				}
				""";

		postLand(body)
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.errors", hasSize(4)))
				.andExpect(jsonPath("$.errors[*].field",
						containsInAnyOrder("geometry", "price", "description", "contact")))
				.andExpect(jsonPath("$.errors[?(@.field == 'price')].message")
						.value("price must be greater than zero"));
		verifyNoInteractions(landService);
	}

	@Test
	void rejectsPriceWithMoreThanTwoDecimalPlaces() throws Exception {
		postLand(VALID_FEATURE.replace("150000.50", "150000.505"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[0].field").value("price"))
				.andExpect(jsonPath("$.errors[0].message").value("price must have at most 2 decimal places"));
	}

	@Test
	void reportsMissingPropertiesFieldByField() throws Exception {
		String body = """
				{
				  "type": "Feature",
				  "geometry": {
				    "type": "Polygon",
				    "coordinates": [[[-47.0, -15.0], [-46.998, -15.0], [-46.998, -14.998], [-47.0, -15.0]]]
				  }
				}
				""";

		postLand(body)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("price", "description", "contact")));
	}

	@Test
	void reportsInvalidGeometryOnTheGeometryField() throws Exception {
		when(landService.register(any()))
				.thenThrow(new InvalidGeometryException("each ring must have at least 4 positions"));

		postLand(VALID_FEATURE)
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value("geometry"))
				.andExpect(jsonPath("$.errors[0].message").value("each ring must have at least 4 positions"));
	}

	@Test
	void returnsConflictWhenTheLandOverlapsAnExistingOne() throws Exception {
		when(landService.register(any())).thenThrow(new LandOverlapException());

		postLand(VALID_FEATURE)
				.andExpect(status().isConflict())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.status").value(409))
				.andExpect(jsonPath("$.detail").value("The polygon overlaps an existing land plot"));
	}

	@Test
	void listsLandsInTheBoundingBoxAsFeatureCollection() throws Exception {
		when(landService.findInBoundingBox(new BoundingBox(-47.5, -15.5, -46.5, -14.5)))
				.thenReturn(LandFeatureCollection.of(List.of(feature())));

		mockMvc.perform(get("/api/lands").param("bbox", "-47.5,-15.5,-46.5,-14.5"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("FeatureCollection"))
				.andExpect(jsonPath("$.features", hasSize(1)))
				.andExpect(jsonPath("$.features[0].type").value("Feature"))
				.andExpect(jsonPath("$.features[0].geometry.type").value("Polygon"))
				.andExpect(jsonPath("$.features[0].properties.id").value(7));
	}

	@Test
	void requiresTheBoundingBox() throws Exception {
		mockMvc.perform(get("/api/lands"))
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
	}

	@Test
	void rejectsMalformedBoundingBox() throws Exception {
		mockMvc.perform(get("/api/lands").param("bbox", "-47.5,-15.5"))
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.detail").value("bbox must be minLon,minLat,maxLon,maxLat"));
	}

	@Test
	void searchesLandsInTheCircle() throws Exception {
		when(landService.findInCircle(new SearchCircle(-47.0, -15.0, 250.0)))
				.thenReturn(LandFeatureCollection.of(List.of(feature())));

		mockMvc.perform(get("/api/lands/search").param("lon", "-47.0").param("lat", "-15.0").param("radius", "250"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("FeatureCollection"))
				.andExpect(jsonPath("$.features[0].properties.id").value(7));
	}

	@Test
	void rejectsNonPositiveRadius() throws Exception {
		mockMvc.perform(get("/api/lands/search").param("lon", "-47.0").param("lat", "-15.0").param("radius", "0"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.detail").value("radius must be greater than zero"));
	}

	@Test
	void rejectsNonNumericSearchParameters() throws Exception {
		mockMvc.perform(get("/api/lands/search").param("lon", "west").param("lat", "-15.0").param("radius", "250"))
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
	}

	private static LandFeature feature() {
		return new LandFeature("Feature", geoJsonRectangle(-47.0, -15.0, -46.998, -14.998),
				new LandFeature.Properties(7L, new BigDecimal("150000.50"), "Flat plot close to the main road",
						"owner@example.com", 47_600.25));
	}

	private ResultActions postLand(String body) throws Exception {
		return mockMvc.perform(post("/api/lands").contentType(MediaType.APPLICATION_JSON).content(body));
	}

}
