package api

import (
	"log"
	"net/http"
	"tour-server/email"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func CancelBooking(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		bookingID := c.Param("id")
		userID := c.Get("user_id").(uint)

		tx := db.Begin()
		if tx.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to start transaction",
			})
		}

		var booking struct {
			ID            uint    `gorm:"column:id"`
			TourDateID    uint    `gorm:"column:tour_date_id"`
			Seats         uint    `gorm:"column:seats"`
			Status        string  `gorm:"column:status"`
			UserID        *uint   `gorm:"column:user_id"`
			CustomerName  string  `gorm:"column:customer_name"`
			CustomerEmail string  `gorm:"column:customer_email"`
			TotalPrice    float64 `gorm:"column:total_price"`
		}
		if err := tx.Raw(
			`SELECT id, tour_date_id, seats, status, user_id,
			        customer_name, customer_email, total_price
			 FROM bookings WHERE id = ?`,
			bookingID,
		).Scan(&booking).Error; err != nil || booking.ID == 0 {
			tx.Rollback()
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Бронювання не знайдено",
			})
		}

		if booking.UserID == nil || *booking.UserID != userID {
			tx.Rollback()
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "Ви не можете скасувати це бронювання",
			})
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
			bookingID,
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

		// ── Email notification ────────────────────────────────────────────
		if booking.CustomerEmail != "" {
			tourTitle := getTourTitle(db, booking.ID)
			email.NotifyBookingCancelled(booking.CustomerEmail, email.BookingNotification{
				CustomerName: booking.CustomerName,
				TourTitle:    tourTitle,
				Seats:        int(booking.Seats),
				TotalPrice:   booking.TotalPrice,
				BookingID:    booking.ID,
				Status:       "cancelled",
			})
			log.Printf("Cancel email queued: booking #%d → %s", booking.ID, booking.CustomerEmail)
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Бронювання скасовано",
		})
	}
}

func getTourTitle(db *gorm.DB, bookingID uint) string {
	var title string
	db.Raw(`
		SELECT t.title FROM tours t
		JOIN tour_dates td ON t.id = td.tour_id
		JOIN bookings b ON b.tour_date_id = td.id
		WHERE b.id = ?
	`, bookingID).Scan(&title)
	if title == "" {
		title = "Тур"
	}
	return title
}