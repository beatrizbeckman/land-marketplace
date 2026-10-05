package com.beatriz.landmarketplace.auth;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokenService;

	AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.tokenService = tokenService;
	}

	public void register(RegisterRequest request) {
		String email = normalize(request.email());
		if (userRepository.existsByEmail(email)) {
			throw new EmailAlreadyRegisteredException();
		}
		try {
			userRepository.save(new User(request.name().trim(), email, passwordEncoder.encode(request.password())));
		}
		catch (DataIntegrityViolationException exception) {
			// Two simultaneous registrations of the same e-mail: the unique constraint refuses the second.
			throw new EmailAlreadyRegisteredException();
		}
	}

	public TokenResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(normalize(request.email()))
				.filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
				.orElseThrow(InvalidCredentialsException::new);
		return new TokenResponse(tokenService.issueFor(user));
	}

	private static String normalize(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

}
