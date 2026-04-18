-- Migration: create tour_views table
-- Tracks which tours a user has viewed, with timestamps for "recently viewed" feature

CREATE TABLE IF NOT EXISTS tour_views (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES tour_users(id) ON DELETE CASCADE,
    tour_id     INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    viewed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    view_count  INTEGER NOT NULL DEFAULT 1,

    UNIQUE(user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_tour_views_user_id ON tour_views(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_views_viewed_at ON tour_views(user_id, viewed_at DESC);
