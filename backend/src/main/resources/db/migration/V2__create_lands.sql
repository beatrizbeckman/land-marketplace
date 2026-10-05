CREATE TABLE lands (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    geom        geometry(Polygon, 4326) NOT NULL,
    price       NUMERIC(14, 2) NOT NULL CHECK (price > 0),
    description VARCHAR(500) NOT NULL,
    contact     VARCHAR(255) NOT NULL,
    -- Coordinates are stored in degrees; the geography cast makes ST_Area return square meters.
    area_sqm    DOUBLE PRECISION GENERATED ALWAYS AS (ST_Area(geom::geography)) STORED
);

CREATE INDEX lands_geom_idx ON lands USING GIST (geom);
