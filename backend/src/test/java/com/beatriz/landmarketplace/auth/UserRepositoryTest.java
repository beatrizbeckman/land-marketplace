package com.beatriz.landmarketplace.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

import com.beatriz.landmarketplace.TestcontainersConfiguration;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
class UserRepositoryTest {

	@Autowired
	private UserRepository userRepository;

	@Test
	void findsUserByEmail() {
		userRepository.saveAndFlush(new User("Ana Souza", "ana@example.com", "hash"));

		assertThat(userRepository.findByEmail("ana@example.com")).get()
				.extracting(User::getName).isEqualTo("Ana Souza");
		assertThat(userRepository.existsByEmail("ana@example.com")).isTrue();
	}

	@Test
	void findsNothingForUnknownEmail() {
		assertThat(userRepository.findByEmail("nobody@example.com")).isEmpty();
		assertThat(userRepository.existsByEmail("nobody@example.com")).isFalse();
	}

	@Test
	void refusesTwoUsersWithTheSameEmail() {
		userRepository.saveAndFlush(new User("Ana Souza", "ana@example.com", "hash"));

		assertThatThrownBy(() -> userRepository.saveAndFlush(new User("Other Ana", "ana@example.com", "hash")))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

}
