package com.beatriz.landmarketplace.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

class TokenServiceTest {

	private static final SecretKeySpec KEY = key("unit-test-secret-with-at-least-32-characters");

	private final TokenService tokenService = new TokenService(new NimbusJwtEncoder(new ImmutableSecret<>(KEY)), 30);

	@Test
	void issuesTokenWithTheUserIdAsSubjectAndTheConfiguredExpiration() {
		String token = tokenService.issueFor(userWithId(42L));

		Jwt jwt = decoderFor(KEY).decode(token);
		assertThat(jwt.getSubject()).isEqualTo("42");
		assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt())).isEqualTo(Duration.ofMinutes(30));
		assertThat(jwt.getExpiresAt()).isAfter(Instant.now());
	}

	@Test
	void issuesTokenThatCannotBeVerifiedWithAnotherSecret() {
		String token = tokenService.issueFor(userWithId(42L));

		JwtDecoder otherDecoder = decoderFor(key("another-secret-with-at-least-32-characters!!"));
		assertThatThrownBy(() -> otherDecoder.decode(token)).isInstanceOf(JwtException.class);
	}

	private static User userWithId(Long id) {
		User user = new User("Ana Souza", "ana@example.com", "hash");
		ReflectionTestUtils.setField(user, "id", id);
		return user;
	}

	private static JwtDecoder decoderFor(SecretKeySpec key) {
		return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
	}

	private static SecretKeySpec key(String secret) {
		return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}

}
