CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    CONSTRAINT users_email_key UNIQUE (email)
);

ALTER TABLE lands
    ADD COLUMN owner_id BIGINT NOT NULL REFERENCES users (id);
