# Land Marketplace

> An interactive map-based platform for listing and searching land plots for sale.

## About

Land Marketplace is an MVP of a real estate platform where listing and searching
for land plots happens directly on an interactive map.

- **Register a plot:** the user draws the exact polygon of the plot on the map and
  fills in a short form (total price, description and contact). The system rejects
  the registration if the new polygon overlaps an existing plot.
- **Search plots:** the user draws a circle on the map with the mouse, and only the
  plots intersecting that circular area are rendered.
- **View details:** clicking a plot opens a popup with its information.

## Tech Stack

- **Backend:** Java, Spring Boot, Spring Data JPA
- **Database:** PostgreSQL with the PostGIS extension
- **Frontend:** React, Vite, OpenLayers
- **Infrastructure:** Docker Compose

## How It Works

TODO: architecture overview, data flow, and technical solutions applied.

## Running with Docker

TODO: step-by-step to start the full environment with docker-compose.

## Running without Docker

### Prerequisites

- JDK 21 or newer
- Node.js 20.19+ or 22.12+
- Docker (used only to run the database) or a local PostgreSQL with PostGIS

### Database

Start only the database service:

    docker compose up -d db

The database is available at `localhost:5432` with the default credentials listed
in `.env.example`. To override them, copy `.env.example` to `.env` and edit the values.

### Backend

    cd backend
    ./mvnw spring-boot:run

The API starts at `http://localhost:8081`. On Windows (outside Git Bash), use
`mvnw.cmd` instead of `./mvnw`.

The connection settings can be overridden with the `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD` and `SERVER_PORT` environment variables.

The backend does not read the `.env` file. If you change `POSTGRES_DB`,
`POSTGRES_USER` or `POSTGRES_PASSWORD` there, set `DB_URL`, `DB_USERNAME` and
`DB_PASSWORD` to the matching values before starting the backend.

### Frontend

    cd frontend
    npm install
    npm run dev

The application is available at `http://localhost:5173`.

## Running the Tests

### Backend

    cd backend
    ./mvnw test

The tests start their own PostGIS container with Testcontainers, so Docker must be
running. The `db` service from `docker-compose.yml` is not required.

TODO: how to open the coverage report (JaCoCo).

### Frontend

TODO: test command and how to open the coverage report.