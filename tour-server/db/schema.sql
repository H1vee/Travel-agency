-- =============================================================================
-- OpenWorld: PostgreSQL database schema (structure only, no data)
-- =============================================================================
-- Creates every table, constraint, index, function and trigger that the Go
-- backend (tour-server) expects, so the project can be deployed on an empty
-- database. Demo data is loaded afterwards by ../migration_catchup.sql.
--
-- Usage (see README.md for the full setup):
--   psql -h 127.0.0.1 -U touruser -d tourdb -f tour-server/db/schema.sql
--   psql -h 127.0.0.1 -U touruser -d tourdb -f tour-server/migration_catchup.sql
--
-- The script is idempotent: every object is created with IF NOT EXISTS or
-- CREATE OR REPLACE, so it can be re-run safely.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Reference tables
-- -----------------------------------------------------------------------------

-- Tour statuses. The frontend admin panel (tour/src/pages/Admin/AdminTours.tsx)
-- relies on fixed identifiers: 1 = active, 2 = inactive, 3 = draft.
-- The backend shows only tours whose status name is 'active'.
CREATE TABLE IF NOT EXISTS statuses (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO statuses (id, name) VALUES
    (1, 'active'),
    (2, 'inactive'),
    (3, 'draft')
ON CONFLICT DO NOTHING;
SELECT setval('statuses_id_seq', GREATEST((SELECT MAX(id) FROM statuses), 1));

CREATE TABLE IF NOT EXISTS locations (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(255) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. Users
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tour_users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,              -- bcrypt hash
    name          VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    avatar_url    TEXT,
    role          VARCHAR(20) NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),
    is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    token       VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user  ON password_reset_tokens(user_id);

-- -----------------------------------------------------------------------------
-- 3. Tours, dates, seats, images
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tours (
    id                   SERIAL PRIMARY KEY,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    call_to_action       VARCHAR(255) NOT NULL,
    price                NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    rating               NUMERIC(3,2) NOT NULL DEFAULT 0.0,
    status_id            INTEGER NOT NULL REFERENCES statuses(id),
    detailed_description TEXT,
    total_seats          INTEGER NOT NULL DEFAULT 0 CHECK (total_seats >= 0)
);
CREATE INDEX IF NOT EXISTS idx_tours_status_id ON tours(status_id);

-- duration is a generated column: the number of days between date_from and date_to.
CREATE TABLE IF NOT EXISTS tour_dates (
    id               SERIAL PRIMARY KEY,
    tour_id          INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    from_location_id INTEGER NOT NULL REFERENCES locations(id),
    to_location_id   INTEGER NOT NULL REFERENCES locations(id),
    date_from        TIMESTAMP NOT NULL,
    date_to          TIMESTAMP NOT NULL,
    duration         INTEGER GENERATED ALWAYS AS
                     (CAST(EXTRACT(DAY FROM (date_to - date_from)) AS INTEGER)) STORED,
    CHECK (date_to > date_from)
);
CREATE INDEX IF NOT EXISTS idx_tour_dates_tour_id ON tour_dates(tour_id);

-- One seat counter per tour date; it is changed by triggers and by the API.
CREATE TABLE IF NOT EXISTS tour_seats (
    id              SERIAL PRIMARY KEY,
    tour_date_id    INTEGER NOT NULL UNIQUE REFERENCES tour_dates(id) ON DELETE CASCADE,
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0)
);

-- One card (cover) image per tour.
CREATE TABLE IF NOT EXISTS tour_card_images (
    id        SERIAL PRIMARY KEY,
    tour_id   INTEGER NOT NULL UNIQUE REFERENCES tours(id) ON DELETE CASCADE,
    image_src TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tour_gallery_images (
    id        SERIAL PRIMARY KEY,
    tour_id   INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    image_src TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tour_gallery_images_tour_id ON tour_gallery_images(tour_id);

-- -----------------------------------------------------------------------------
-- 4. Bookings and LiqPay payments
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bookings (
    id                       SERIAL PRIMARY KEY,
    tour_date_id             INTEGER NOT NULL REFERENCES tour_dates(id),
    customer_name            VARCHAR(255) NOT NULL,
    customer_email           VARCHAR(255),
    customer_phone           VARCHAR(20) NOT NULL,
    seats                    INTEGER NOT NULL CHECK (seats > 0),
    total_price              NUMERIC(10,2) NOT NULL,
    status                   VARCHAR(20) NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    booked_at                TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id                  INTEGER REFERENCES tour_users(id) ON DELETE SET NULL,
    is_guest_booking         BOOLEAN NOT NULL DEFAULT TRUE,
    payment_status           VARCHAR(20) DEFAULT 'pending'
                             CHECK (payment_status IN ('pending', 'paid', 'failed', 'reversed')),
    liqpay_order_id          VARCHAR(100),
    liqpay_payment_id        VARCHAR(100),
    paid_at                  TIMESTAMP,
    payment_token            VARCHAR(64),             -- guest "pay later" magic link
    payment_token_expires_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id        ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_date_id   ON bookings(tour_date_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booked_at      ON bookings(booked_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_liqpay_order
    ON bookings(liqpay_order_id) WHERE liqpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_payment_token
    ON bookings(payment_token) WHERE payment_token IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Reviews, comments, ratings, likes, favourites, view history
-- -----------------------------------------------------------------------------

-- Reviews and comments share one table: top-level rows may carry a rating,
-- replies reference their parent via parent_id. Guests post with guest_name.
CREATE TABLE IF NOT EXISTS tour_reviews (
    id                SERIAL PRIMARY KEY,
    tour_id           INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id           INTEGER REFERENCES tour_users(id) ON DELETE CASCADE,
    booking_id        INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    parent_id         INTEGER REFERENCES tour_reviews(id) ON DELETE CASCADE,
    guest_name        VARCHAR(255),
    rating            INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment           TEXT NOT NULL,
    is_verified_buyer BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_tour_id   ON tour_reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_parent_id ON tour_reviews(parent_id);

-- Per-user star ratings (POST /tour-ratings), one per user and tour.
CREATE TABLE IF NOT EXISTS tour_ratings (
    id          SERIAL PRIMARY KEY,
    tour_id     INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    rating      NUMERIC(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tour_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tour_ratings_tour_id ON tour_ratings(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_ratings_user_id ON tour_ratings(user_id);

-- Likes/dislikes on comments: either a registered user or a guest token.
CREATE TABLE IF NOT EXISTS tour_review_likes (
    id            SERIAL PRIMARY KEY,
    review_id     INTEGER NOT NULL REFERENCES tour_reviews(id) ON DELETE CASCADE,
    user_id       INTEGER REFERENCES tour_users(id) ON DELETE CASCADE,
    guest_token   VARCHAR(128),
    reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (
        (user_id IS NOT NULL AND guest_token IS NULL) OR
        (user_id IS NULL AND guest_token IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id   ON tour_review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id     ON tour_review_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_guest_token ON tour_review_likes(guest_token);

CREATE TABLE IF NOT EXISTS tour_user_favorites (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    tour_id    INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, tour_id)
);

-- "Recently viewed" history of a signed-in user.
CREATE TABLE IF NOT EXISTS tour_views (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    tour_id     INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    viewed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    view_count  INTEGER NOT NULL DEFAULT 1,
    UNIQUE (user_id, tour_id)
);
CREATE INDEX IF NOT EXISTS idx_tour_views_user_id   ON tour_views(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_views_viewed_at ON tour_views(user_id, viewed_at DESC);

-- -----------------------------------------------------------------------------
-- 6. Triggers: seat accounting
-- -----------------------------------------------------------------------------

-- Before a booking is inserted, lock the seat counter of the tour date,
-- check that enough seats are left and decrease the counter.
CREATE OR REPLACE FUNCTION decrease_seats()
RETURNS TRIGGER AS $$
DECLARE
    current_seats INT;
BEGIN
    SELECT available_seats
      INTO current_seats
      FROM tour_seats
     WHERE tour_date_id = NEW.tour_date_id
       FOR UPDATE;

    IF current_seats < NEW.seats THEN
        RAISE EXCEPTION 'Not enough seats available';
    END IF;

    UPDATE tour_seats
       SET available_seats = available_seats - NEW.seats
     WHERE tour_date_id = NEW.tour_date_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrease_seats ON bookings;
CREATE TRIGGER trg_decrease_seats
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION decrease_seats();

-- After a booking row is deleted, return its seats to the counter, but never
-- above the total number of seats of the tour.
CREATE OR REPLACE FUNCTION restore_seats()
RETURNS TRIGGER AS $$
DECLARE
    current_seats INT;
    max_seats     INT;
BEGIN
    SELECT available_seats
      INTO current_seats
      FROM tour_seats
     WHERE tour_date_id = OLD.tour_date_id
       FOR UPDATE;

    SELECT t.total_seats
      INTO max_seats
      FROM tours t
      JOIN tour_dates td ON td.tour_id = t.id
     WHERE td.id = OLD.tour_date_id;

    IF current_seats IS NOT NULL AND current_seats + OLD.seats <= max_seats THEN
        UPDATE tour_seats
           SET available_seats = available_seats + OLD.seats
         WHERE tour_date_id = OLD.tour_date_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restore_seats ON bookings;
CREATE TRIGGER trg_restore_seats
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION restore_seats();

-- -----------------------------------------------------------------------------
-- 7. Triggers: tour rating
-- -----------------------------------------------------------------------------

-- tours.rating = average of the per-user ratings (tour_ratings) and of the
-- ratings in top-level reviews written by verified buyers (tour_reviews).
-- If a user has both, the value from tour_ratings wins. Rounded to 0.1.
CREATE OR REPLACE FUNCTION recalculate_tour_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_tour_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_tour_id := OLD.tour_id;
    ELSE
        v_tour_id := NEW.tour_id;
    END IF;

    UPDATE tours
       SET rating = COALESCE((
            SELECT ROUND(AVG(r.rating)::numeric, 1)
              FROM (
                    SELECT tr.rating::numeric AS rating
                      FROM tour_ratings tr
                     WHERE tr.tour_id = v_tour_id
                    UNION ALL
                    SELECT rv.rating::numeric
                      FROM tour_reviews rv
                     WHERE rv.tour_id = v_tour_id
                       AND rv.parent_id IS NULL
                       AND rv.rating IS NOT NULL
                       AND rv.is_verified_buyer = TRUE
                       AND (rv.user_id IS NULL OR NOT EXISTS (
                            SELECT 1 FROM tour_ratings x
                             WHERE x.tour_id = rv.tour_id
                               AND x.user_id = rv.user_id))
                   ) r
           ), 0)
     WHERE id = v_tour_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_tour_rating ON tour_reviews;
CREATE TRIGGER trg_update_tour_rating
AFTER INSERT OR UPDATE OR DELETE ON tour_reviews
FOR EACH ROW
EXECUTE FUNCTION recalculate_tour_rating();

DROP TRIGGER IF EXISTS trg_update_tour_rating_from_ratings ON tour_ratings;
CREATE TRIGGER trg_update_tour_rating_from_ratings
AFTER INSERT OR UPDATE OR DELETE ON tour_ratings
FOR EACH ROW
EXECUTE FUNCTION recalculate_tour_rating();

COMMIT;
