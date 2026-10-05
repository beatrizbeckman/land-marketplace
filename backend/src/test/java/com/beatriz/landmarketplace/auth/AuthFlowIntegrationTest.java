package com.beatriz.landmarketplace.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.beatriz.landmarketplace.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AuthFlowIntegrationTest {

	private static final String LIST_URL = "/api/lands?bbox=-47.01,-15.01,-46.99,-14.99";

	private static final String LAND = """
			{
			  "type": "Feature",
			  "geometry": {
			    "type": "Polygon",
			    "coordinates": [[[-47.0, -15.0], [-46.998, -15.0], [-46.998, -14.998], [-47.0, -14.998], [-47.0, -15.0]]]
			  },
			  "properties": {
			    "price": 150000.50,
			    "description": "Flat plot close to the main road",
			    "contact": "ana@example.com"
			  }
			}
			""";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtEncoder jwtEncoder;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@AfterEach
	void deleteData() {
		jdbcTemplate.update("DELETE FROM lands");
		jdbcTemplate.update("DELETE FROM users");
	}

	@Test
	void registeredUserLogsInRegistersLandAndSeesItAsOwned() throws Exception {
		String anaToken = registerAndLogin("ana@example.com");
		String brunoToken = registerAndLogin("bruno@example.com");

		mockMvc.perform(json(post("/api/lands"), LAND).header(HttpHeaders.AUTHORIZATION, "Bearer " + anaToken))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.properties.ownedByMe").value(true));

		mockMvc.perform(get(LIST_URL).header(HttpHeaders.AUTHORIZATION, "Bearer " + anaToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.features[0].properties.ownedByMe").value(true));
		mockMvc.perform(get(LIST_URL).header(HttpHeaders.AUTHORIZATION, "Bearer " + brunoToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.features[0].properties.ownedByMe").value(false));
		mockMvc.perform(get(LIST_URL))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.features[0].properties.ownedByMe").value(false));
	}

	@Test
	void rejectsLandRegistrationWithoutToken() throws Exception {
		mockMvc.perform(json(post("/api/lands"), LAND))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsSecondRegistrationOfTheSameEmail() throws Exception {
		register("ana@example.com").andExpect(status().isCreated());

		register("ANA@example.com").andExpect(status().isConflict());
	}

	@Test
	void rejectsLoginWithWrongPassword() throws Exception {
		register("ana@example.com").andExpect(status().isCreated());

		mockMvc.perform(json(post("/api/auth/login"), """
				{ "email": "ana@example.com", "password": "wrong-pass" }
				"""))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsTamperedTokenEvenOnPublicRoutes() throws Exception {
		String token = registerAndLogin("ana@example.com");
		String tampered = token.substring(0, token.length() - 3) + (token.endsWith("AAA") ? "BBB" : "AAA");

		mockMvc.perform(get(LIST_URL).header(HttpHeaders.AUTHORIZATION, "Bearer " + tampered))
				.andExpect(status().isUnauthorized());
		mockMvc.perform(json(post("/api/lands"), LAND).header(HttpHeaders.AUTHORIZATION, "Bearer " + tampered))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsExpiredTokenEvenOnPublicRoutes() throws Exception {
		// Signed with the real secret; only the expiration (beyond the decoder's clock skew) is wrong.
		Instant issuedAt = Instant.now().minusSeconds(7200);
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.subject("1")
				.issuedAt(issuedAt)
				.expiresAt(issuedAt.plusSeconds(3600))
				.build();
		String expired = jwtEncoder
				.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
				.getTokenValue();

		mockMvc.perform(get(LIST_URL).header(HttpHeaders.AUTHORIZATION, "Bearer " + expired))
				.andExpect(status().isUnauthorized());
	}

	private String registerAndLogin(String email) throws Exception {
		register(email).andExpect(status().isCreated());
		String body = mockMvc.perform(json(post("/api/auth/login"), """
				{ "email": "%s", "password": "s3cret-pass" }
				""".formatted(email)))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.token");
	}

	private ResultActions register(String email) throws Exception {
		return mockMvc.perform(json(post("/api/auth/register"), """
				{ "name": "Test User", "email": "%s", "password": "s3cret-pass" }
				""".formatted(email)));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

}
