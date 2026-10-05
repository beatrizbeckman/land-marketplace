package com.beatriz.landmarketplace.land;

import java.math.BigDecimal;
import java.util.List;

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

	// Each filter is optional: a null parameter turns its condition into "true". The casts tell
	// PostgreSQL the type of a parameter that arrives as null. Shared by both search queries.
	String PRICE_AND_AREA_FILTERS = """
			  AND (CAST(:minPrice AS numeric) IS NULL OR price >= :minPrice)
			  AND (CAST(:maxPrice AS numeric) IS NULL OR price <= :maxPrice)
			  AND (CAST(:minArea AS double precision) IS NULL OR area_sqm >= :minArea)
			  AND (CAST(:maxArea AS double precision) IS NULL OR area_sqm <= :maxArea)
			""";

	@Query(value = """
			SELECT *
			FROM lands
			WHERE ST_Intersects(geom, ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326))
			""" + PRICE_AND_AREA_FILTERS + "ORDER BY id", nativeQuery = true)
	List<Land> findIntersectingBoundingBox(@Param("minLon") double minLon, @Param("minLat") double minLat,
			@Param("maxLon") double maxLon, @Param("maxLat") double maxLat,
			@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice,
			@Param("minArea") Double minArea, @Param("maxArea") Double maxArea);

	// On geography ST_DWithin measures real meters over the spheroid, at any latitude. The cast
	// is written exactly like the expression of lands_geog_idx so the planner can use that index.
	@Query(value = """
			SELECT *
			FROM lands
			WHERE ST_DWithin(
			    CAST(geom AS geography),
			    CAST(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) AS geography),
			    :radiusInMeters)
			""" + PRICE_AND_AREA_FILTERS + "ORDER BY id", nativeQuery = true)
	List<Land> findWithinRadius(@Param("lon") double lon, @Param("lat") double lat,
			@Param("radiusInMeters") double radiusInMeters,
			@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice,
			@Param("minArea") Double minArea, @Param("maxArea") Double maxArea);

}
