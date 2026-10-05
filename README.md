# Land Marketplace

> An interactive map-based platform for listing and searching land plots for sale.

## 1. What it is

Land Marketplace is an MVP of a real estate platform where listing and searching
for land plots happens directly on an interactive map.

- **Register a plot:** a signed-in user draws the exact polygon of the plot on the
  map and fills in a short form (total price, description and contact). The system
  rejects the registration if the new polygon overlaps an existing plot. Plots that
  only share a border or a corner are allowed, as neighbours are.
- **Search plots:** the user draws a circle on the map with the mouse, and only the
  plots intersecting that circular area are returned.
- **Browse the map:** the plots inside the visible area of the map are listed as
  the user moves around, optionally filtered by price and by area in square meters.
- **View details:** clicking a plot shows its price, description, contact and area.
- **Accounts:** users register and log in with e-mail and password. Every plot is
  linked to the user who created it, and the API tells each user which plots are theirs.

### Tech stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 4.1, Spring Data JPA, Hibernate Spatial, Spring Security |
| Database | PostgreSQL 16 with PostGIS 3.4, schema versioned with Flyway |
| Frontend | React, Vite, OpenLayers |
| Tests | JUnit, Mockito, Testcontainers (real PostGIS), JaCoCo |
| Infrastructure | Docker Compose |

## 2. How it works

### Architecture

The backend is organised by feature, with the usual layers side by side inside each
feature package:

```
com.beatriz.landmarketplace
├── land/     controller, service, repository, entity, GeoJSON conversion and validation
├── auth/     controller, service, repository, user entity, token issuing
├── config/   security configuration (JWT, CORS, access rules)
└── error/    one global handler that turns exceptions into HTTP responses
```

- **Controllers** only deal with HTTP: they read the request, call a service and
  return the result.
- **Services** hold the business rules.
- **Repositories** hold the SQL, including every spatial query.
- Request and response objects are separate records; JPA entities are never exposed.

A hexagonal architecture was considered and discarded: the central rule of the
system (overlap detection) is a PostGIS query by requirement, so an isolated domain
layer would be almost empty and every port would have a single implementation.

### Data flow

```
map (OpenLayers)  ->  GeoJSON over HTTP  ->  Spring Boot API  ->  PostGIS
```

1. The user draws a polygon on the map. The frontend sends it as a GeoJSON
   `Feature`, with coordinates in `[longitude, latitude]` order.
2. The API validates the form fields and the shape of the polygon, then converts
   it into a JTS `Polygon` (the Java geometry type that Hibernate Spatial maps to
   the PostGIS `geometry` column).
3. PostGIS answers every spatial question: whether the polygon overlaps an existing
   plot, which plots intersect the visible area, which plots are within a radius,
   and how large a plot is. Plots are never loaded into memory to be compared in Java.
4. Results go back as a GeoJSON `Feature` or `FeatureCollection`.

### Why SRID 4326

GeoJSON coordinates are WGS 84 longitude and latitude, which is SRID 4326. Storing
the same SRID means that what the map sends is what the database stores, with no
reprojection on the way in or out. The column is declared as
`geometry(Polygon, 4326)`, so the database itself refuses any other geometry type
or coordinate system.

Coordinates in degrees are not suitable for measuring, so whenever meters are needed
(area and search radius) the query casts the geometry to `geography`, which computes
over the curvature of the Earth.

### Spatial queries and why each function was chosen

**Overlap check when registering a plot**

```sql
SELECT EXISTS (
    SELECT 1 FROM lands
    WHERE geom && :polygon
      AND ST_Relate(geom, :polygon, '2********')
)
```

`ST_Relate` with the DE-9IM pattern `2********` is true when the interiors of the
two polygons share an area. That covers partial overlap, one plot inside another
and identical plots, and it is false for plots that only touch along a border or at
a vertex, which is the rule for neighbouring plots.

| Function | Partial overlap | One inside the other | Identical | Only touching | Fits the rule |
|---|---|---|---|---|---|
| `ST_Intersects` | blocks | blocks | blocks | blocks | no, neighbours would be refused |
| `ST_Overlaps` | blocks | allows | allows | allows | no, a plot inside another would pass |
| `ST_Intersects AND NOT ST_Touches` | blocks | blocks | blocks | allows | yes, with two geometric computations |
| `ST_Relate(..., '2********')` | blocks | blocks | blocks | allows | yes, with one |

`ST_Relate` with a pattern does not use indexes on its own, so the bounding box
operator `&&` comes first and lets the GiST index discard distant plots.

**Plots in the visible area of the map**

```sql
WHERE ST_Intersects(geom, ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326))
```

For display, a plot cut by the edge of the screen must be returned, so plain
intersection is the right question here. `ST_Intersects` uses the GiST index by itself.

**Plots intersecting the search circle**

```sql
WHERE ST_DWithin(
    CAST(geom AS geography),
    CAST(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) AS geography),
    :radiusInMeters)
```

A plot intersects the circle when its shortest distance to the center is at most
the radius. On `geography`, `ST_DWithin` measures that distance in real meters at
any latitude.

| Option | Precision | Why not |
|---|---|---|
| `ST_DWithin` on `geography` | real meters anywhere | chosen |
| `ST_DWithin` on a projected geometry | depends on the projection | no single projection is accurate for the whole world |
| `ST_Buffer` + `ST_Intersects` | the circle becomes a polygon with straight sides | approximate exactly at the edge, and builds an extra geometry per search |

**Area in square meters**

```sql
area_sqm DOUBLE PRECISION GENERATED ALWAYS AS (ST_Area(geom::geography)) STORED
```

The area is a generated column: PostgreSQL computes it once on insert, it can never
disagree with the polygon, and filtering by area is a plain number comparison.

**Indexes**

| Index | Used by |
|---|---|
| `GIST (geom)` | overlap check and visible-area listing |
| `GIST ((geom::geography))` | radius search, which compares the geography cast |

A GiST index stores the bounding box of each plot. Queries first discard, through
the index, every plot whose box is nowhere near, and run the exact geometric
computation only on the few candidates left.

**Optional filters**

`minPrice`, `maxPrice`, `minArea` and `maxArea` are accepted by both searches. Each
one is written as `parameter IS NULL OR column compared to parameter`, in a single
SQL fragment shared by the two queries, so an absent filter simply does not restrict
anything and the filter logic exists in one place.

### Concurrency

Two simultaneous registrations of overlapping polygons could both pass the overlap
check before either is saved. To prevent that, the check and the insert run in one
transaction, after taking a PostgreSQL transaction-level advisory lock
(`pg_advisory_xact_lock`). Registrations therefore run one at a time: the second
waits for the first to commit, and its overlap check then sees the plot just saved.
The lock is released automatically on commit or rollback, and reads are never blocked.

An integration test fires eight simultaneous registrations of the same polygon and
asserts that exactly one is saved.

### Input validation

- **Form fields** (Bean Validation): price is required, greater than zero and has
  at most 2 decimal places; description has 10 to 500 characters; contact is an
  e-mail or a phone number with 10 to 15 digits.
- **Geometry**: type `Polygon`, at least 4 positions per ring, closed rings,
  longitude within -180..180 and latitude within -90..90, and no self-intersection.
- **Money** is `NUMERIC(14, 2)` in the database and `BigDecimal` in Java, never a
  floating-point type.

### Authentication

- Passwords are stored as BCrypt hashes. They are never returned or logged.
- `POST /api/auth/login` returns a JWT signed with HS256, carrying the user id and
  an expiration. The client sends it as `Authorization: Bearer <token>`.
- The API is stateless: no session, no cookie.
- Listing, searching, registering and logging in are public. Everything else,
  including `POST /api/lands`, requires a valid token.
- The owner of a plot always comes from the token, never from the request body.
- Public routes accept an optional token: with a valid one, each plot is returned
  with `ownedByMe` computed for that user; without one, `ownedByMe` is `false`. An
  invalid or expired token is answered with `401` on any route.
- E-mails are unique, enforced by a database constraint.
- The JWT secret, its expiration and the allowed CORS origin come from environment
  variables.

### API

Geometries are GeoJSON in EPSG:4326, `[longitude, latitude]` order.

| Method and path | Access | Description | Responses |
|---|---|---|---|
| `POST /api/auth/register` | public | body `{ name, email, password }` | `201`, `400`, `409` e-mail already registered |
| `POST /api/auth/login` | public | body `{ email, password }` | `200 { token }`, `400`, `401` |
| `GET /api/lands?bbox=minLon,minLat,maxLon,maxLat` | public | plots intersecting the visible area | `200` FeatureCollection, `400` |
| `GET /api/lands/search?lon=&lat=&radius=` | public | plots intersecting a circle, radius in meters | `200` FeatureCollection, `400` |
| `POST /api/lands` | token required | GeoJSON Feature with a Polygon and `properties { price, description, contact }` | `201` Feature, `400`, `401`, `409` overlap |

Both `GET` routes accept the optional filters `minPrice`, `maxPrice`, `minArea` and
`maxArea` (area in square meters).

Properties of every returned Feature: `id`, `price`, `description`, `contact`,
`areaSqm` and `ownedByMe`.

Errors follow Problem Details (RFC 7807). Validation errors of a request body also
carry the list of invalid fields:

```json
{
  "status": 400,
  "title": "Bad Request",
  "detail": "Validation failed",
  "errors": [
    { "field": "price", "message": "price must be greater than zero" }
  ]
}
```

## 3. Running with Docker

The only requirement is Docker. No file has to be created beforehand.

    docker compose up --build

This starts PostgreSQL with PostGIS, waits for it to be healthy, and then starts the
API, which applies the database migrations by itself.

| Service | URL |
|---|---|
| API | http://localhost:8081 |
| Database | `localhost:5432`, database `land_marketplace`, user `postgres`, password `postgres` |

<!-- frontend: add the frontend service URL here once its container is part of docker-compose.yml -->

To stop everything, press `Ctrl+C` or run `docker compose down`. Add `-v` to also
delete the database volume.

**About the default values.** `docker-compose.yml` ships development defaults for the
database password and the JWT secret, so that the project runs with a single command.
They exist for local evaluation only. To change them, copy `.env.example` to `.env`
and edit it; Docker Compose reads that file automatically. If port 5432 is already in
use on your machine, set `POSTGRES_PORT` there.

A quick check that the API is up:

    curl "http://localhost:8081/api/lands?bbox=-47.01,-15.01,-46.99,-14.99"

It returns `{"type":"FeatureCollection","features":[]}` on an empty database.

## 4. Running without Docker

### Prerequisites

- JDK 21 or newer
- Node.js 20.19+ or 22.12+
- PostgreSQL 16 with PostGIS 3.4

### Database

Install PostgreSQL and the PostGIS package for your system (for example
`postgresql-16-postgis-3` on Debian or Ubuntu, `brew install postgis` on macOS, or
the PostGIS option of the Windows installer's Stack Builder). Then create the database:

    createdb -U postgres land_marketplace

Nothing else is needed: on startup the API enables the PostGIS extension and creates
the tables and indexes through its Flyway migrations. Enabling an extension requires
a privileged database user, so use `postgres` or another superuser for local development.

If you prefer not to install PostgreSQL, the database alone can come from Docker:

    docker compose up -d db

### Backend

    cd backend
    ./mvnw spring-boot:run

The API starts at `http://localhost:8081`. On Windows outside Git Bash, use
`mvnw.cmd` instead of `./mvnw`.

The backend reads its configuration from environment variables, each with a
development default:

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/land_marketplace` | JDBC URL of the database |
| `DB_USERNAME` | `postgres` | database user |
| `DB_PASSWORD` | `postgres` | database password |
| `SERVER_PORT` | `8081` | HTTP port of the API |
| `JWT_SECRET` | a development-only value | secret that signs the tokens, at least 32 characters |
| `JWT_EXPIRATION_MINUTES` | `60` | how long a login token is valid |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | browser origin allowed to call the API (the Vite dev server) |

The backend does not read the `.env` file; that file is only for Docker Compose.
Outside Docker, export the variables you want to change before starting the API.

### Frontend

    cd frontend
    npm install
    npm run dev

The application is available at `http://localhost:5173`.

## 5. Running the tests

### Backend

Docker must be running: the integration tests start their own PostGIS container
with Testcontainers, so they run against the real database engine and never touch
your development data. The `db` service from `docker-compose.yml` is not required.

    cd backend
    ./mvnw verify

This runs the unit and integration tests, writes the coverage report and **fails the
build if line or branch coverage is below 80%**.

Open the report at:

    backend/target/site/jacoco/index.html

Current coverage is about 99% of lines and 92% of branches, with no class excluded
from the report.

`./mvnw test` runs the tests and writes the same report without enforcing the threshold.

What the tests cover:

- **Repositories against real PostGIS:** partial overlap, a plot inside another,
  identical plots, plots that only share a border or a vertex (allowed), the visible
  area, a circle that reaches only the border of a plot, a circle with no result,
  and price and area filters on both searches.
- **Services with Mockito:** registration rules, lock ordering, ownership.
- **Web layer:** status codes, per-field validation, the Problem Details format,
  `401` without a token, `409` for overlap and for a duplicate e-mail.
- **Authentication end to end:** register, login, expired and tampered tokens, and
  public routes with and without a token.
- **Concurrency:** simultaneous overlapping registrations.

### Frontend

<!-- frontend: add the test command, the coverage report location and the 80% threshold here -->
