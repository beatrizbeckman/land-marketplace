package com.beatriz.landmarketplace.land;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateLandRequest(
		@NotNull(message = "geometry is required") GeoJsonPolygon geometry,
		@Valid Properties properties) {

	// An e-mail address, or a phone number with 10 to 15 digits that may contain +, spaces, parentheses and hyphens.
	private static final String CONTACT_PATTERN = "^(?:[^@\\s]+@[^@\\s]+\\.[^@\\s]+|\\+?(?:[\\s()-]*\\d){10,15}[\\s()-]*)$";

	// A Feature without "properties" is reported field by field, like one with empty properties.
	public CreateLandRequest {
		if (properties == null) {
			properties = new Properties(null, null, null);
		}
	}

	public record Properties(
			@NotNull(message = "price is required")
			@Positive(message = "price must be greater than zero")
			@Digits(integer = 12, fraction = 2, message = "price must have at most 2 decimal places")
			BigDecimal price,

			@NotBlank(message = "description is required")
			@Size(min = 10, max = 500, message = "description must have between 10 and 500 characters")
			String description,

			@NotBlank(message = "contact is required")
			@Size(max = 255, message = "contact must have at most 255 characters")
			@Pattern(regexp = CONTACT_PATTERN, message = "contact must be a valid e-mail or a phone number with 10 to 15 digits")
			String contact) {
	}

}
