package com.beatriz.landmarketplace.land;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/lands")
class LandController {

	private final LandService landService;

	LandController(LandService landService) {
		this.landService = landService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	LandFeature register(@Valid @RequestBody CreateLandRequest request) {
		return landService.register(request);
	}

}
