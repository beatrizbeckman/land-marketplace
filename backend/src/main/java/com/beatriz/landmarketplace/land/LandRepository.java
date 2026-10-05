package com.beatriz.landmarketplace.land;

import org.locationtech.jts.geom.Polygon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface LandRepository extends JpaRepository<Land, Long> {

	// Transaction-level advisory lock: registrations run one at a time, so the overlap check of a
	// transaction always sees the plots committed by the previous one. Released on commit or rollback.
	@Query(value = "SELECT CAST(pg_advisory_xact_lock(hashtext('land_registration')) AS text)", nativeQuery = true)
	String lockRegistrations();

	// '2********' is a DE-9IM pattern: the two interiors share an area. Plots that only touch along
	// a border or at a vertex do not match. ST_Relate does not use indexes by itself, so the
	// bounding box operator (&&) comes first to let the GiST index discard distant plots.
	@Query(value = """
			SELECT EXISTS (
			    SELECT 1
			    FROM lands
			    WHERE geom && :polygon
			      AND ST_Relate(geom, :polygon, '2********')
			)
			""", nativeQuery = true)
	boolean existsOverlapping(@Param("polygon") Polygon polygon);

}
