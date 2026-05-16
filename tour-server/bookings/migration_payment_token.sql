-- Migration: add payment_token to bookings for guest "pay later" magic-links.
-- Token is sent in the booking-created email and lets unauthenticated guests
-- return to the payment flow without having to log in or remember a booking ID.

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS payment_token VARCHAR(64),
    ADD COLUMN IF NOT EXISTS payment_token_expires_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_payment_token
    ON bookings(payment_token)
    WHERE payment_token IS NOT NULL;
