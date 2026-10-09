package com.beatriz.landmarketplace.land;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

	// register a plot of land
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	LandFeature register(@Valid @RequestBody CreateLandRequest request, @AuthenticationPrincipal Jwt jwt) {
		return landService.register(request, userId(jwt));
	}

	// lists plots within the map's visible area
	@GetMapping
	LandFeatureCollection listInBoundingBox(@RequestParam String bbox,
			@RequestParam(required = false) BigDecimal minPrice,
			@RequestParam(required = false) BigDecimal maxPrice,
			@RequestParam(required = false) Double minArea,
			@RequestParam(required = false) Double maxArea,
			@AuthenticationPrincipal Jwt jwt) {
		return landService.findInBoundingBox(BoundingBox.parse(bbox),
				new LandFilter(minPrice, maxPrice, minArea, maxArea), userId(jwt));
	}

	// search for plots of land within a circle
	@GetMapping("/search")
	LandFeatureCollection searchInCircle(@RequestParam double lon, @RequestParam double lat,
			@RequestParam double radius,
			@RequestParam(required = false) BigDecimal minPrice,
			@RequestParam(required = false) BigDecimal maxPrice,
			@RequestParam(required = false) Double minArea,
			@RequestParam(required = false) Double maxArea,
			@AuthenticationPrincipal Jwt jwt) {
		return landService.findInCircle(new SearchCircle(lon, lat, radius),
				new LandFilter(minPrice, maxPrice, minArea, maxArea), userId(jwt));
	}

	// Public routes are also reached without a token; then there is no principal.
	private static Long userId(Jwt jwt) {
		return jwt == null ? null : Long.valueOf(jwt.getSubject());
	}

}
