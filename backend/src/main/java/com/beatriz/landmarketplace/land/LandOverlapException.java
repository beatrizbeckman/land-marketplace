package com.beatriz.landmarketplace.land;

public class LandOverlapException extends RuntimeException {

	public LandOverlapException() {
		super("The polygon overlaps an existing land plot");
	}

}
