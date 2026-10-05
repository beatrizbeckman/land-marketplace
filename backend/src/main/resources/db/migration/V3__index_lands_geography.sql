-- The radius search compares geom::geography in meters; the index on the geometry column
-- cannot serve that expression, so it needs its own GiST index.
CREATE INDEX lands_geog_idx ON lands USING GIST ((geom::geography));
