package com.beatriz.landmarketplace.land;

import java.math.BigDecimal;

import org.hibernate.annotations.Generated;
import org.locationtech.jts.geom.Polygon;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "lands")
public class Land {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "geom")
	private Polygon geometry;

	private BigDecimal price;

	private String description;

	private String contact;

	// Only the id is needed (ownedByMe), so the owner is not mapped as an entity association.
	@Column(name = "owner_id")
	private Long ownerId;

	// Generated column: PostgreSQL computes it from the polygon, Hibernate only reads it back after the insert.
	@Generated
	@Column(name = "area_sqm")
	private Double areaSqm;

	protected Land() {
	}

	public Land(Polygon geometry, BigDecimal price, String description, String contact, Long ownerId) {
		this.geometry = geometry;
		this.price = price;
		this.description = description;
		this.contact = contact;
		this.ownerId = ownerId;
	}

	public Long getId() {
		return id;
	}

	public Polygon getGeometry() {
		return geometry;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public String getDescription() {
		return description;
	}

	public String getContact() {
		return contact;
	}

	public Long getOwnerId() {
		return ownerId;
	}

	public Double getAreaSqm() {
		return areaSqm;
	}

}
