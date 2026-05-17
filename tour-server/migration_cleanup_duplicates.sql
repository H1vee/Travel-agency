-- Видалення дублюючих тригерів та індексів.
--
-- Контекст:
--   * На tour_reviews існували два набори тригерів, що виконують одну й ту саму
--     роботу (перерахунок tours.rating): trg_tour_rating_insert/update/delete
--     та trg_update_tour_rating. Залишаємо один універсальний trg_update_tour_rating.
--   * Деякі індекси були створені двічі під різними іменами.
--   * Тригер trg_update_tour_rating_from_ratings на tour_ratings залишений: він
--     обслуговує окрему таблицю tour_ratings, яка використовується ендпоінтом
--     POST /tour-ratings (див. tour-server/tourratings/api/post_tour_rating.go).

BEGIN;

-- 1. Дублюючі тригери на tour_reviews ---------------------------------------
DROP TRIGGER IF EXISTS trg_tour_rating_insert ON tour_reviews;
DROP TRIGGER IF EXISTS trg_tour_rating_update ON tour_reviews;
DROP TRIGGER IF EXISTS trg_tour_rating_delete ON tour_reviews;

-- 2. Дублюючі індекси -------------------------------------------------------
-- tour_ratings: лишаємо канонічні *_tour_id / *_user_id.
DROP INDEX IF EXISTS idx_tour_ratings_tour;
DROP INDEX IF EXISTS idx_tour_ratings_user;

-- tour_reviews
DROP INDEX IF EXISTS idx_tour_reviews_parent;

-- tour_review_likes
DROP INDEX IF EXISTS idx_tour_review_likes_review;

-- bookings: idx_bookings_liqpay_order (UNIQUE partial) лишаємо, бо він
-- одночасно й індекс, і обмеження унікальності; не-унікальний дублікат прибираємо.
DROP INDEX IF EXISTS idx_bookings_liqpay_order_id;

COMMIT;
