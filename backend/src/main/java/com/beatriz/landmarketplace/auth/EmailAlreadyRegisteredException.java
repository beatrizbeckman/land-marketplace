package com.beatriz.landmarketplace.auth;

public class EmailAlreadyRegisteredException extends RuntimeException {

	public EmailAlreadyRegisteredException() {
		super("This e-mail is already registered");
	}

}
