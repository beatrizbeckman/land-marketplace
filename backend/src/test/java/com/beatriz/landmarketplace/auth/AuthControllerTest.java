package com.beatriz.landmarketplace.auth;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.beatriz.landmarketplace.config.SecurityConfig;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private AuthService authService;

	@Test
	void registersUser() throws Exception {
		postJson("/api/auth/register", """
				{ "name": "Ana Souza", "email": "ana@example.com", "password": "s3cret-pass" }
				""")
				.andExpect(status().isCreated())
				.andExpect(content().string(""));

		verify(authService).register(new RegisterRequest("Ana Souza", "ana@example.com", "s3cret-pass"));
	}

	@Test
	void reportsEachInvalidRegistrationField() throws Exception {
		postJson("/api/auth/register", """
				{ "name": " ", "email": "not-an-email", "password": "short" }
				""")
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("name", "email", "password")))
				.andExpect(jsonPath("$.errors[?(@.field == 'password')].message")
						.value("password must have between 8 and 72 characters"));
		verifyNoInteractions(authService);
	}

	@Test
	void returnsConflictWhenTheEmailIsAlreadyRegistered() throws Exception {
		doThrow(new EmailAlreadyRegisteredException()).when(authService).register(any());

		postJson("/api/auth/register", """
				{ "name": "Ana Souza", "email": "ana@example.com", "password": "s3cret-pass" }
				""")
				.andExpect(status().isConflict())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.detail").value("This e-mail is already registered"));
	}

	@Test
	void returnsTokenOnLogin() throws Exception {
		when(authService.login(new LoginRequest("ana@example.com", "s3cret-pass")))
				.thenReturn(new TokenResponse("signed-token"));

		postJson("/api/auth/login", """
				{ "email": "ana@example.com", "password": "s3cret-pass" }
				""")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").value("signed-token"));
	}

	@Test
	void returnsUnauthorizedForInvalidCredentials() throws Exception {
		when(authService.login(any())).thenThrow(new InvalidCredentialsException());

		postJson("/api/auth/login", """
				{ "email": "ana@example.com", "password": "wrong-pass" }
				""")
				.andExpect(status().isUnauthorized())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.detail").value("Invalid e-mail or password"));
	}

	@Test
	void requiresEmailAndPasswordToLogin() throws Exception {
		postJson("/api/auth/login", "{}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("email", "password")));
	}

	private ResultActions postJson(String path, String body) throws Exception {
		return mockMvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body));
	}

}
