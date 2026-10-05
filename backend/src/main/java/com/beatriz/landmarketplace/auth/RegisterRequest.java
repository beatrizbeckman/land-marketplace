package com.beatriz.landmarketplace.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
		@NotBlank(message = "name is required")
		@Size(max = 100, message = "name must have at most 100 characters")
		String name,

		@NotBlank(message = "email is required")
		@Email(message = "email must be a valid e-mail address")
		@Size(max = 255, message = "email must have at most 255 characters")
		String email,

		// BCrypt only reads the first 72 bytes of a password, so longer ones are refused.
		@NotBlank(message = "password is required")
		@Size(min = 8, max = 72, message = "password must have between 8 and 72 characters")
		String password) {
}
