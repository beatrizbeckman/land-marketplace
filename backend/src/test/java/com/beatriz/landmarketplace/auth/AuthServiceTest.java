package com.beatriz.landmarketplace.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	// Minimum BCrypt cost, to keep the unit tests fast.
	private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

	@Mock
	private UserRepository userRepository;

	@Mock
	private TokenService tokenService;

	private AuthService authService;

	@BeforeEach
	void setUp() {
		authService = new AuthService(userRepository, passwordEncoder, tokenService);
	}

	@Test
	void registersUserWithHashedPasswordAndNormalizedEmail() {
		authService.register(new RegisterRequest(" Ana Souza ", " Ana@Example.COM ", "s3cret-pass"));

		ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(saved.capture());
		assertThat(saved.getValue().getName()).isEqualTo("Ana Souza");
		assertThat(saved.getValue().getEmail()).isEqualTo("ana@example.com");
		assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("s3cret-pass");
		assertThat(passwordEncoder.matches("s3cret-pass", saved.getValue().getPasswordHash())).isTrue();
	}

	@Test
	void rejectsEmailThatIsAlreadyRegistered() {
		when(userRepository.existsByEmail("ana@example.com")).thenReturn(true);

		assertThatThrownBy(() -> authService.register(new RegisterRequest("Ana", "ANA@example.com", "s3cret-pass")))
				.isInstanceOf(EmailAlreadyRegisteredException.class);

		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void rejectsEmailRegisteredByASimultaneousRequest() {
		when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("users_email_key"));

		assertThatThrownBy(() -> authService.register(new RegisterRequest("Ana", "ana@example.com", "s3cret-pass")))
				.isInstanceOf(EmailAlreadyRegisteredException.class);
	}

	@Test
	void issuesTokenForValidCredentials() {
		User user = new User("Ana", "ana@example.com", passwordEncoder.encode("s3cret-pass"));
		when(userRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(user));
		when(tokenService.issueFor(user)).thenReturn("signed-token");

		TokenResponse response = authService.login(new LoginRequest(" Ana@Example.com ", "s3cret-pass"));

		assertThat(response.token()).isEqualTo("signed-token");
	}

	@Test
	void rejectsWrongPassword() {
		User user = new User("Ana", "ana@example.com", passwordEncoder.encode("s3cret-pass"));
		when(userRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(user));

		assertThatThrownBy(() -> authService.login(new LoginRequest("ana@example.com", "wrong-pass")))
				.isInstanceOf(InvalidCredentialsException.class)
				.hasMessage("Invalid e-mail or password");

		verifyNoInteractions(tokenService);
	}

	@Test
	void rejectsUnknownEmailWithTheSameMessage() {
		when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@example.com", "s3cret-pass")))
				.isInstanceOf(InvalidCredentialsException.class)
				.hasMessage("Invalid e-mail or password");
	}

}
