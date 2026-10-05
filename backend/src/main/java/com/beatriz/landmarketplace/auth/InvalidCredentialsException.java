package com.beatriz.landmarketplace.auth;

public class InvalidCredentialsException extends RuntimeException {

	// The same message for an unknown e-mail and a wrong password, so the API does not reveal which e-mails exist.
	public InvalidCredentialsException() {
		super("Invalid e-mail or password");
	}

}
