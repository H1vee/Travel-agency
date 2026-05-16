-- =============================================================================
-- CATCH-UP MIGRATION
-- =============================================================================
-- Brings the schema (restored from the outdated scripts/db_dump.sql) up to what
-- the current Go backend expects. Also seeds 5 demo tours (Boston, Dubai,
-- Egypt, Maldives, Taiwan) — those are the destinations with full carousel
-- imagery available in tour-server/static/.
--
-- Idempotent: re-runs are safe. Seed inserts are guarded by ON CONFLICT or
-- existence checks so they won't duplicate rows.
--
-- Run as:
--   PGPASSWORD=tourpass123 psql -h 127.0.0.1 -U touruser -d tourdb \
--     -f tour-server/migration_catchup.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. MISSING COLUMNS ON EXISTING TABLES
-- =============================================================================

-- bookings: LiqPay payment tracking + magic-link token for guest "pay later"
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS payment_status            VARCHAR(20) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS liqpay_order_id           VARCHAR(100),
    ADD COLUMN IF NOT EXISTS liqpay_payment_id         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS paid_at                   TIMESTAMP,
    ADD COLUMN IF NOT EXISTS payment_token             VARCHAR(64),
    ADD COLUMN IF NOT EXISTS payment_token_expires_at  TIMESTAMP;

DO $$ BEGIN
    ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'reversed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status   ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_liqpay_order_id  ON bookings(liqpay_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booked_at        ON bookings(booked_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_payment_token
    ON bookings(payment_token) WHERE payment_token IS NOT NULL;

-- tour_reviews: nested replies, guest names, verified-buyer flag
-- (the tourcomments package maps TourComment model onto tour_reviews)
ALTER TABLE tour_reviews
    ADD COLUMN IF NOT EXISTS parent_id          INTEGER REFERENCES tour_reviews(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS guest_name         VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_verified_buyer  BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tour_reviews_parent_id ON tour_reviews(parent_id);

-- =============================================================================
-- 2. MISSING TABLES
-- =============================================================================

-- 2.1 tour_views — "recently viewed" tracking
CREATE TABLE IF NOT EXISTS tour_views (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    tour_id     INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    viewed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    view_count  INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, tour_id)
);
CREATE INDEX IF NOT EXISTS idx_tour_views_user_id   ON tour_views(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_views_viewed_at ON tour_views(user_id, viewed_at DESC);

-- 2.2 password_reset_tokens — used by /auth/forgot-password flow
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

-- 2.3 tour_ratings — per-user star ratings (separate from comment reviews)
CREATE TABLE IF NOT EXISTS tour_ratings (
    id          SERIAL PRIMARY KEY,
    tour_id     INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    rating      NUMERIC(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tour_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tour_ratings_tour_id ON tour_ratings(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_ratings_user_id ON tour_ratings(user_id);

-- 2.4 tour_review_likes — likes/dislikes on comments (user OR guest_token)
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

-- =============================================================================
-- 3. SEED DATA
-- =============================================================================
-- Only inserts if the table is empty (or uses ON CONFLICT). Re-running won't
-- duplicate rows.

-- 3.1 statuses
INSERT INTO statuses (name) VALUES
    ('Active'), ('Draft'), ('Archived')
ON CONFLICT (name) DO NOTHING;

-- 3.2 locations
INSERT INTO locations (name, country) VALUES
    ('Київ',     'Україна'),
    ('Львів',    'Україна'),
    ('Бостон',   'США'),
    ('Дубай',    'ОАЕ'),
    ('Каїр',     'Єгипет'),
    ('Мале',     'Мальдіви'),
    ('Тайбей',   'Тайвань')
ON CONFLICT (name) DO NOTHING;

-- 3.3 demo users (admin / user) — passwords: admin123 / user123
INSERT INTO tour_users (email, password_hash, name, phone, role, is_verified)
VALUES
    ('admin@openworld.local',
     '$2a$10$Ztg3SXiVNdL1o31JtLM1u.kILjWsYH1PcUBsggHPzUlzYFcj9rOlK',
     'Admin', '+380501112233', 'admin', true),
    ('user@openworld.local',
     '$2a$10$jfxBxowRYWaQjEHfJRhj3ev.uobxAZ4HMI6YCdanxW2..Wy4vNMhy',
     'Тестовий Користувач', '+380504445566', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- 3.4 tours + dates + seats + images
-- Skip the whole tour seeding block if any tours already exist (avoids dupes
-- but lets you wipe `tours` and re-run to refresh).
DO $$
DECLARE
    v_status_active     INT;
    v_loc_kyiv          INT;
    v_loc_boston        INT;
    v_loc_dubai         INT;
    v_loc_cairo         INT;
    v_loc_male          INT;
    v_loc_taipei        INT;
    v_tour_id           INT;
    v_date_id           INT;
BEGIN
    IF (SELECT COUNT(*) FROM tours) > 0 THEN
        RAISE NOTICE 'tours table is non-empty, skipping demo tour seed';
        RETURN;
    END IF;

    SELECT id INTO v_status_active FROM statuses WHERE name = 'Active';
    SELECT id INTO v_loc_kyiv      FROM locations WHERE name = 'Київ';
    SELECT id INTO v_loc_boston    FROM locations WHERE name = 'Бостон';
    SELECT id INTO v_loc_dubai     FROM locations WHERE name = 'Дубай';
    SELECT id INTO v_loc_cairo     FROM locations WHERE name = 'Каїр';
    SELECT id INTO v_loc_male      FROM locations WHERE name = 'Мале';
    SELECT id INTO v_loc_taipei    FROM locations WHERE name = 'Тайбей';

    -- ─── BOSTON ─────────────────────────────────────────────────────────
    INSERT INTO tours (title, description, call_to_action, price,
                       status_id, detailed_description, total_seats, rating)
    VALUES (
        'Бостон — академічна Америка',
        'Прогулянка коледжами Айві-Ліги, Boston Tea Party, freedom trail та морепродукти Атлантики.',
        'Забронювати тур до Бостона',
        38500.00, v_status_active,
        'Сім днів у культурній столиці Нової Англії: Гарвард і MIT, квартал Beacon Hill, Boston Public Library, прогулянка набережною Charles River та класична New England chowder. У програмі — оглядові тури з ліцензованим гідом, відвідування Музею образотворчих мистецтв і одноденна поїздка до Кейп-Кода.',
        20, 4.8
    ) RETURNING id INTO v_tour_id;

    INSERT INTO tour_card_images (tour_id, image_src) VALUES (v_tour_id, '/static/boston.jpg');
    INSERT INTO tour_gallery_images (tour_id, image_src) VALUES
        (v_tour_id, '/static/carousel/Boston_1.jpg'),
        (v_tour_id, '/static/carousel/Boston_2.jpg'),
        (v_tour_id, '/static/carousel/Boston_3.jpg'),
        (v_tour_id, '/static/carousel/Boston_4.jpg');

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_boston,
            NOW() + INTERVAL '30 days', NOW() + INTERVAL '37 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 18);

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_boston,
            NOW() + INTERVAL '60 days', NOW() + INTERVAL '67 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 20);

    -- ─── DUBAI ──────────────────────────────────────────────────────────
    INSERT INTO tours (title, description, call_to_action, price,
                       status_id, detailed_description, total_seats, rating)
    VALUES (
        'Дубай — місто майбутнього',
        'Burj Khalifa, пустельне сафарі, Palm Jumeirah і шопінг у Dubai Mall.',
        'Забронювати тур до Дубая',
        45200.00, v_status_active,
        'П''ять ночей у самому серці ОАЕ. Прогулянки нічним Дубаєм, оглядовий тур на 124-му поверсі Burj Khalifa, джип-сафарі у пустелі Аль-Кудра з вечерею просто неба, аквапарк Atlantis і затишний пляжний день на Jumeirah Beach. Виліт із Києва, готель 4★ із сніданками, трансфери та страхування включено.',
        24, 4.9
    ) RETURNING id INTO v_tour_id;

    INSERT INTO tour_card_images (tour_id, image_src) VALUES (v_tour_id, '/static/dubai.jpg');
    INSERT INTO tour_gallery_images (tour_id, image_src) VALUES
        (v_tour_id, '/static/carousel/Dubai_1.jpg'),
        (v_tour_id, '/static/carousel/Dubai_2.jpg'),
        (v_tour_id, '/static/carousel/Dubai_3.jpg'),
        (v_tour_id, '/static/carousel/Dubai_4.jpg');

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_dubai,
            NOW() + INTERVAL '20 days', NOW() + INTERVAL '25 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 22);

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_dubai,
            NOW() + INTERVAL '45 days', NOW() + INTERVAL '50 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 24);

    -- ─── EGYPT ──────────────────────────────────────────────────────────
    INSERT INTO tours (title, description, call_to_action, price,
                       status_id, detailed_description, total_seats, rating)
    VALUES (
        'Єгипет — таємниці фараонів',
        'Піраміди Гізи, Луксор, круїз по Нілу та снорклінг у Червоному морі.',
        'Забронювати тур до Єгипту',
        32800.00, v_status_active,
        'Дев''ять днів класичного Єгипту: Каїр з пірамідами та Сфінксом, переліт у Луксор, чотириденний круїз по Нілу Луксор—Асуан із зупинками у Едфу й Ком-Омбо, а на завершення — два дні відпочинку у Хургаді з виходом у море і снорклінгом на коралових рифах. Усі вхідні квитки, єгиптолог-гід та харчування у круїзі включено.',
        16, 4.7
    ) RETURNING id INTO v_tour_id;

    INSERT INTO tour_card_images (tour_id, image_src) VALUES (v_tour_id, '/static/egypt.png');
    INSERT INTO tour_gallery_images (tour_id, image_src) VALUES
        (v_tour_id, '/static/carousel/Egypt_1.jpg'),
        (v_tour_id, '/static/carousel/Egypt_2.jpg'),
        (v_tour_id, '/static/carousel/Egypt_3.jpg'),
        (v_tour_id, '/static/carousel/Egypt_4.jpg');

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_cairo,
            NOW() + INTERVAL '40 days', NOW() + INTERVAL '49 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 14);

    -- ─── MALDIVES ───────────────────────────────────────────────────────
    INSERT INTO tours (title, description, call_to_action, price,
                       status_id, detailed_description, total_seats, rating)
    VALUES (
        'Мальдіви — приватне бунгало над водою',
        'Сім ночей на атолі Баа: бунгало overwater, риф у двох кроках і вечері при свічках.',
        'Забронювати тур на Мальдіви',
        72400.00, v_status_active,
        'Преміум-відпочинок для двох: переліт Київ—Мале з пересадкою, гідроліт до резорту 5★ на атолі Баа, бунгало overwater з прямим виходом до лагуни. У вартість входять сніданки й вечері, безкоштовний снорклінг-сет, спа-сертифікат на пару, а також прогулянка на катамарані для зустрічі заходу сонця з дельфінами. Wi-Fi та трансфери включено.',
        12, 4.95
    ) RETURNING id INTO v_tour_id;

    INSERT INTO tour_card_images (tour_id, image_src) VALUES (v_tour_id, '/static/maldives.jpg');
    INSERT INTO tour_gallery_images (tour_id, image_src) VALUES
        (v_tour_id, '/static/carousel/Maldives_1.jpg'),
        (v_tour_id, '/static/carousel/Maldives_2.jpg'),
        (v_tour_id, '/static/carousel/Maldives_3.jpg'),
        (v_tour_id, '/static/carousel/Maldives_4.jpg');

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_male,
            NOW() + INTERVAL '55 days', NOW() + INTERVAL '62 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 10);

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_male,
            NOW() + INTERVAL '90 days', NOW() + INTERVAL '97 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 12);

    -- ─── TAIWAN ─────────────────────────────────────────────────────────
    INSERT INTO tours (title, description, call_to_action, price,
                       status_id, detailed_description, total_seats, rating)
    VALUES (
        'Тайвань — острів контрастів',
        'Тайбей-101, нічні ринки, гарячі джерела та чайні плантації Алішань.',
        'Забронювати тур до Тайваню',
        49600.00, v_status_active,
        'Десять днів від хмарочосів до чайних плантацій: Тайбей із заходом на оглядовий майданчик Тайбей-101, ніч на гарячих джерелах Бейтоу, поїздка до національного парку Тароко з мармуровим каньйоном, дві ночі у горах Алішань зустрічі світанку та екскурсії плантаціями улуну, і завершення в Гаосюні. Внутрішні перельоти й переїзди швидкісними поїздами включено.',
        18, 4.6
    ) RETURNING id INTO v_tour_id;

    INSERT INTO tour_card_images (tour_id, image_src) VALUES (v_tour_id, '/static/taiwan.jpg');
    INSERT INTO tour_gallery_images (tour_id, image_src) VALUES
        (v_tour_id, '/static/carousel/Taiwan_1.jpg'),
        (v_tour_id, '/static/carousel/Taiwan_2.jpg'),
        (v_tour_id, '/static/carousel/Taiwan_3.jpg'),
        (v_tour_id, '/static/carousel/Taiwan_4.jpg');

    INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
    VALUES (v_tour_id, v_loc_kyiv, v_loc_taipei,
            NOW() + INTERVAL '70 days', NOW() + INTERVAL '80 days')
    RETURNING id INTO v_date_id;
    INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (v_date_id, 16);

    RAISE NOTICE 'Seeded 5 demo tours: Boston, Dubai, Egypt, Maldives, Taiwan';
END $$;

COMMIT;

-- =============================================================================
-- Verification queries (run manually):
--
--   SELECT id, title, price FROM tours ORDER BY id;
--   SELECT COUNT(*) FROM tour_dates;
--   SELECT COUNT(*) FROM tour_gallery_images;
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='bookings' AND column_name LIKE 'payment%';
-- =============================================================================
