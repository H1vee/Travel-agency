package api

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"tour-server/bookings/dto"
	"tour-server/bookings/models"
	"tour-server/email"
	"tour-server/middleware"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func PostBookings(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Println("PostBookings triggered")

		var req dto.BookingRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request"})
		}

		// ── Input validation ──────────────────────────────────────────────
		req.CustomerName = middleware.SanitizeName(req.CustomerName, 100)
		if errMsg := middleware.ValidateName(req.CustomerName); errMsg != "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": errMsg})
		}

		if errMsg := middleware.ValidatePhone(req.CustomerPhone); errMsg != "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": errMsg})
		}

		if strings.TrimSpace(req.CustomerEmail) == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Email обов'язковий"})
		}
		if errMsg := middleware.ValidateEmail(req.CustomerEmail); errMsg != "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": errMsg})
		}

		if req.Seats == 0 || req.Seats > 20 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Кількість місць: від 1 до 20"})
		}

		if req.TourDateID == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "tour_date_id обов'язковий"})
		}

		// ── Auth check ────────────────────────────────────────────────────
		var userID *uint
		var isGuestBooking bool

		if userIDValue := c.Get("user_id"); userIDValue != nil {
			if uid, ok := userIDValue.(uint); ok && uid > 0 {
				userID = &uid
				isGuestBooking = false
				log.Printf("Authenticated user ID: %d\n", uid)
			} else {
				userID = nil
				isGuestBooking = true
			}
		} else {
			userID = nil
			isGuestBooking = true
		}

		// ── Check available seats + get price from DB ─────────────────────
		var seatInfo struct {
			AvailableSeats uint    `gorm:"column:available_seats"`
			Price          float64 `gorm:"column:price"`
		}

		err := db.Raw(`
			SELECT ts.available_seats, t.price
			FROM tour_seats ts
			JOIN tour_dates td ON ts.tour_date_id = td.id
			JOIN tours t ON td.tour_id = t.id
			WHERE ts.tour_date_id = ?
		`, req.TourDateID).Scan(&seatInfo).Error

		if err != nil || seatInfo.Price == 0 {
			log.Printf("Error checking seats/price: %v\n", err)
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Дату туру не знайдено"})
		}

		if seatInfo.AvailableSeats < uint(req.Seats) {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Недостатньо вільних місць"})
		}

		// ── Server-side price calculation ─────────────────────────────────
		// IGNORE total_price from client — calculate from DB price × seats
		calculatedPrice := seatInfo.Price * float64(req.Seats)

		log.Printf("Price check: client sent %.2f, server calculated %.2f (%.2f × %d)",
			req.TotalPrice, calculatedPrice, seatInfo.Price, req.Seats)

		booking := models.Bookings{
			TourDateID:     req.TourDateID,
			CustomerName:   req.CustomerName,
			CustomerEmail:  req.CustomerEmail,
			CustomerPhone:  req.CustomerPhone,
			Seats:          req.Seats,
			TotalPrice:     calculatedPrice, // from DB, not from client
			Status:         "pending",
			UserID:         userID,
			IsGuestBooking: isGuestBooking,
		}

		log.Printf("Creating booking: UserID=%v, IsGuest=%v, tour_date_id=%d, price=%.2f",
			userID, isGuestBooking, booking.TourDateID, calculatedPrice)

		if err := db.Create(&booking).Error; err != nil {
			log.Printf("Error creating booking %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to create booking"})
		}

		// ── Magic-link payment token for guests ───────────────────────────
		var paymentURL string
		if isGuestBooking {
			token, err := generatePaymentToken()
			if err != nil {
				log.Printf("Failed to generate payment token: %v", err)
			} else {
				expiresAt := time.Now().Add(7 * 24 * time.Hour)
				if err := db.Exec(
					"UPDATE bookings SET payment_token = ?, payment_token_expires_at = ? WHERE id = ?",
					token, expiresAt, booking.ID,
				).Error; err != nil {
					log.Printf("Failed to save payment token: %v", err)
				} else {
					paymentURL = buildPaymentURL(token)
				}
			}
		}

		// ── Email notification (async) ────────────────────────────────────
		tourTitle := getTourTitleByDateID(db, req.TourDateID)
		email.NotifyBookingCreated(req.CustomerEmail, email.BookingNotification{
			CustomerName: req.CustomerName,
			TourTitle:    tourTitle,
			Seats:        int(req.Seats),
			TotalPrice:   calculatedPrice,
			BookingID:    booking.ID,
			Status:       "pending",
			PaymentURL:   paymentURL,
		})
		log.Printf("Booking created email queued: #%d → %s", booking.ID, req.CustomerEmail)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message":     "Booking successful",
			"booking_id":  booking.ID,
			"is_guest":    isGuestBooking,
			"total_price": calculatedPrice,
		})
	}
}

func generatePaymentToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func buildPaymentURL(token string) string {
	base := os.Getenv("FRONTEND_URL")
	if base == "" {
		base = "https://openworld.local"
	}
	return fmt.Sprintf("%s/pay/%s", base, token)
}

func getTourTitleByDateID(db *gorm.DB, tourDateID uint) string {
	var title string
	db.Raw(`
		SELECT t.title FROM tours t
		JOIN tour_dates td ON t.id = td.tour_id
		WHERE td.id = ?
	`, tourDateID).Scan(&title)
	if title == "" {
		title = "Тур"
	}
	return title
}