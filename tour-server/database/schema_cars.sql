-- ============================================================
-- AutoBoss car dealership schema
-- PostgreSQL. Run once on a fresh database, or after dropping
-- the old tour-specific tables. Idempotent where practical.
-- ============================================================

-- ----------------------------------------------------------------
-- Statuses: control whether a car is displayed on the site.
--   active -> visible to visitors
--   hidden -> stored but not shown publicly
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS statuses (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO statuses (name) VALUES ('active'), ('hidden')
    ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------
-- Users (admins). Auth is reused for the admin panel only.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tour_users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    avatar_url    TEXT,
    role          VARCHAR(20) DEFAULT 'user',
    is_verified   BOOLEAN     DEFAULT FALSE,
    created_at    TIMESTAMP   DEFAULT NOW(),
    updated_at    TIMESTAMP   DEFAULT NOW(),
    last_login    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Cars: the core catalogue entity.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cars (
    id                SERIAL PRIMARY KEY,
    make              VARCHAR(100) NOT NULL,
    model             VARCHAR(100) NOT NULL,
    year              INT          NOT NULL,
    vin               VARCHAR(64),
    price             NUMERIC(12,2) NOT NULL,
    mileage           INT,                       -- kilometres
    fuel_type         VARCHAR(40),               -- petrol / diesel / electric / hybrid / gas
    engine            VARCHAR(150),              -- free-text engine description, e.g. "2.0 TDI"
    engine_capacity   NUMERIC(4,1),              -- litres (NULL for pure electric)
    battery_capacity  NUMERIC(7,1),              -- kW / kWh (electric only)
    transmission      VARCHAR(40),               -- gearbox: manual / automatic / robot / cvt
    drive             VARCHAR(20),               -- front / rear / all
    body_type         VARCHAR(60),               -- sedan / suv / hatchback / ...
    color             VARCHAR(60),
    seats             INT,                       -- seating capacity
    description       TEXT,                      -- detailed vehicle description
    status_id         INT NOT NULL REFERENCES statuses(id),
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cars_status     ON cars(status_id);
CREATE INDEX IF NOT EXISTS idx_cars_make       ON cars(make);
CREATE INDEX IF NOT EXISTS idx_cars_body_type  ON cars(body_type);
CREATE INDEX IF NOT EXISTS idx_cars_year       ON cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_price      ON cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_fuel_type  ON cars(fuel_type);

-- ----------------------------------------------------------------
-- Car images: one card (thumbnail) image + a gallery carousel.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_card_images (
    id        SERIAL PRIMARY KEY,
    car_id    INT NOT NULL UNIQUE REFERENCES cars(id) ON DELETE CASCADE,
    image_src TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS car_gallery_images (
    id        SERIAL PRIMARY KEY,
    car_id    INT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    image_src TEXT NOT NULL,
    position  INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_car_gallery_car ON car_gallery_images(car_id);

-- ----------------------------------------------------------------
-- Inquiries: the three call-to-action buttons all funnel here.
--   request_type: turnkey_quote | renovation_cost | question
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
    id             SERIAL PRIMARY KEY,
    car_id         INT REFERENCES cars(id) ON DELETE SET NULL,
    request_type   VARCHAR(40) NOT NULL,
    contact_method VARCHAR(80),               -- "how should we contact you?"
    phone          VARCHAR(50) NOT NULL,
    name           VARCHAR(120),
    message        TEXT,
    status         VARCHAR(20) DEFAULT 'new'  -- new / processed
                   CHECK (status IN ('new', 'processed')),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_car    ON inquiries(car_id);
