package com.beatriz.landmarketplace.land;

import static com.beatriz.landmarketplace.land.TestPolygons.geoJsonRectangle;
import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.beatriz.landmarketplace.TestcontainersConfiguration;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class LandRegistrationConcurrencyTest {

	private static final int SIMULTANEOUS_REQUESTS = 8;

	@Autowired
	private LandService landService;

	@Autowired
	private LandRepository landRepository;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@AfterEach
	void deleteData() {
		jdbcTemplate.update("DELETE FROM lands");
		jdbcTemplate.update("DELETE FROM users");
	}

	@Test
	void onlyOneOfManySimultaneousOverlappingRegistrationsSucceeds() throws Exception {
		Long ownerId = jdbcTemplate.queryForObject("""
				INSERT INTO users (name, email, password_hash)
				VALUES ('Owner', 'owner@example.com', 'not-a-real-hash')
				RETURNING id
				""", Long.class);
		CreateLandRequest request = new CreateLandRequest(
				geoJsonRectangle(-47.000, -15.000, -46.998, -14.998),
				new CreateLandRequest.Properties(new BigDecimal("150000.50"),
						"Flat plot close to the main road", "owner@example.com"));
		CountDownLatch start = new CountDownLatch(1);
		List<Future<Boolean>> attempts = new ArrayList<>();

		try (ExecutorService executor = Executors.newFixedThreadPool(SIMULTANEOUS_REQUESTS)) {
			for (int i = 0; i < SIMULTANEOUS_REQUESTS; i++) {
				attempts.add(executor.submit(() -> {
					start.await();
					try {
						landService.register(request, ownerId);
						return true;
					}
					catch (LandOverlapException exception) {
						return false;
					}
				}));
			}
			start.countDown();
		}

		long registered = 0;
		for (Future<Boolean> attempt : attempts) {
			if (attempt.get()) {
				registered++;
			}
		}
		assertThat(registered).isEqualTo(1);
		assertThat(landRepository.count()).isEqualTo(1);
	}

}
