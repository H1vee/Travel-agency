-- ============================================================
-- Sample data for the AutoBoss car catalogue.
-- Safe to run after schema_cars.sql. Re-running adds duplicates,
-- so run on a fresh DB or truncate cars first.
-- ============================================================

-- Default admin user (password: "admin123" — change after first login).
-- Hash is bcrypt of "admin123".
INSERT INTO tour_users (email, password_hash, name, role, is_verified)
VALUES (
    'admin@autoboss.local',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Administrator',
    'admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Sample cars
WITH active AS (SELECT id FROM statuses WHERE name = 'active')
INSERT INTO cars
    (make, model, year, vin, price, mileage, fuel_type, engine, engine_capacity,
     battery_capacity, transmission, drive, body_type, color, seats, description, status_id)
VALUES
    ('BMW', 'X5', 2021, 'WBAJA1C50K123456', 48500, 62000, 'diesel', '3.0d xDrive', 3.0,
     NULL, 'automatic', 'all', 'suv', 'Black', 5,
     'Привезений з Німеччини. Повна сервісна історія, один власник, ідеальний технічний стан.',
     (SELECT id FROM active)),
    ('Audi', 'A6', 2020, 'WAUZZZ4G0LN123456', 32900, 88000, 'petrol', '2.0 TFSI', 2.0,
     NULL, 'automatic', 'front', 'sedan', 'Grey', 5,
     'Premium комплектація, шкіряний салон, віртуальна панель приладів. Розмитнений.',
     (SELECT id FROM active)),
    ('Tesla', 'Model 3', 2022, '5YJ3E1EA7NF123456', 36500, 31000, 'electric', 'Long Range Dual Motor', NULL,
     82.0, 'automatic', 'all', 'sedan', 'White', 5,
     'Електромобіль з запасом ходу понад 500 км. Autopilot, швидка зарядка.',
     (SELECT id FROM active)),
    ('Volkswagen', 'Tiguan', 2019, 'WVGZZZ5NZKW123456', 24700, 105000, 'diesel', '2.0 TDI', 2.0,
     NULL, 'robot', 'all', 'suv', 'Blue', 5,
     'Сімейний кросовер, економічний дизель, повний привід 4Motion.',
     (SELECT id FROM active)),
    ('Toyota', 'Camry', 2021, '4T1B11HK5MU123456', 28900, 54000, 'hybrid', '2.5 Hybrid', 2.5,
     NULL, 'cvt', 'front', 'sedan', 'Silver', 5,
     'Гібрид, низька витрата палива, надійність Toyota. Свіжопригнаний.',
     (SELECT id FROM active)),
    ('Mercedes-Benz', 'E-Class', 2020, 'WDD2130461A123456', 39900, 71000, 'petrol', 'E 200', 2.0,
     NULL, 'automatic', 'rear', 'sedan', 'Black', 5,
     'Бізнес-седан, AMG-пакет, максимальна комплектація.',
     (SELECT id FROM active));

-- Card images for the seeded cars (placeholder paths under /static)
INSERT INTO car_card_images (car_id, image_src)
SELECT id, '/static/no-image.jpg' FROM cars
ON CONFLICT (car_id) DO NOTHING;
