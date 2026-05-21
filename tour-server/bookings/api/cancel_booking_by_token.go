package api

import (
	"log"
	"net/http"
	"time"
	"tour-server/email"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// CancelBookingByToken lets a guest cancel their own booking via the secret
// magic-link token — no account needed. Same rule as CancelBooking: only a
// pending booking can be self-cancelled; a confirmed/paid one goes through
// a manager.
func CancelBookingByToken(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		token := c.Param("token")
		if len(token) != 64 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Посилання недійсне"})
		}

		tx := db.Begin()
		if tx.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to start transaction",
			})
		}

		var booking struct {
			ID            uint       `gorm:"column:id"`
			TourDateID    uint       `gorm:"column:tour_date_id"`
			Seats         uint       `gorm:"column:seats"`
			Status        string     `gorm:"column:status"`
			CustomerName  string     `gorm:"column:customer_name"`
			CustomerEmail string     `gorm:"column:customer_email"`
			TotalPrice    float64    `gorm:"column:total_price"`
			ExpiresAt     *time.Time `gorm:"column:payment_token_expires_at"`
		}
		if err := tx.Raw(
			`SELECT id, tour_date_id, seats, status, customer_name,
			        customer_email, total_price, payment_token_expires_at
			 FROM bookings WHERE payment_token = ?`,
			token,
		).Scan(&booking).Error; err != nil || booking.ID == 0 {
			tx.Rollback()
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Посилання недійсне"})
		}

		if booking.ExpiresAt != nil && time.Now().After(*booking.ExpiresAt) {
			tx.Rollback()
			return c.JSON(http.StatusGone, map[string]string{"error": "Термін дії посилання сплив"})
		}

		if booking.Status != "pending" {
			tx.Rollback()
			if booking.Status == "cancelled" {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Бронювання вже скасовано",
				})
			}
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Підтверджене бронювання можна скасувати лише через менеджера",
			})
		}

		if err := tx.Exec(
			"UPDATE tour_seats SET available_seats = available_seats + ? WHERE tour_date_id = ?",
			booking.Seats, booking.TourDateID,
		).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Не вдалося повернути місця",
			})
		}

		if err := tx.Exec(
			"UPDATE bookings SET status = 'cancelled' WHERE id = ?",
			booking.ID,
		).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Не вдалося скасувати бронювання",
			})
		}

		if err := tx.Commit().Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка збереження",
			})
		}

		if booking.CustomerEmail != "" {
			email.NotifyBookingCancelled(booking.CustomerEmail, email.BookingNotification{
				CustomerName: booking.CustomerName,
				TourTitle:    getTourTitle(db, booking.ID),
				Seats:        int(booking.Seats),
				TotalPrice:   booking.TotalPrice,
				BookingID:    booking.ID,
				Status:       "cancelled",
			})
			log.Printf("Guest cancel email queued: booking #%d → %s", booking.ID, booking.CustomerEmail)
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "Бронювання скасовано"})
	}
}
