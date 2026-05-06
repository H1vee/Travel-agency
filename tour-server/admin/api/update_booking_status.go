package api

import (
	"log"
	"net/http"
	"strconv"
	"tour-server/email"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

func UpdateBookingStatus(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		idParam := c.Param("id")
		bookingIDInt, err := strconv.Atoi(idParam)
		if err != nil || bookingIDInt <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Невалідний ID бронювання",
			})
		}

		var req UpdateStatusRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request",
			})
		}

		if req.Status != "pending" && req.Status != "confirmed" && req.Status != "cancelled" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid status. Must be: pending, confirmed, cancelled",
			})
		}

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
			CustomerName  string  `gorm:"column:customer_name"`
			CustomerEmail string  `gorm:"column:customer_email"`
			TotalPrice    float64 `gorm:"column:total_price"`
		}
		if err := tx.Raw(
			`SELECT id, tour_date_id, seats, status, customer_name, customer_email, total_price
			 FROM bookings WHERE id = ?`,
			bookingIDInt,
		).Scan(&booking).Error; err != nil || booking.ID == 0 {
			tx.Rollback()
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Booking not found",
			})
		}

		prevStatus := booking.Status
		newStatus := req.Status

		if prevStatus == newStatus {
			tx.Rollback()
			return c.JSON(http.StatusOK, map[string]string{
				"message": "Booking status unchanged",
			})
		}

		switch {
		case newStatus == "cancelled" && (prevStatus == "pending" || prevStatus == "confirmed"):
			if err := tx.Exec(
				"UPDATE tour_seats SET available_seats = available_seats + ? WHERE tour_date_id = ?",
				booking.Seats, booking.TourDateID,
			).Error; err != nil {
				tx.Rollback()
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Failed to restore seats",
				})
			}

		case prevStatus == "cancelled" && (newStatus == "pending" || newStatus == "confirmed"):
			var availableSeats uint
			tx.Raw(
				"SELECT available_seats FROM tour_seats WHERE tour_date_id = ?",
				booking.TourDateID,
			).Scan(&availableSeats)

			if availableSeats < booking.Seats {
				tx.Rollback()
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Not enough available seats to reactivate booking",
				})
			}

			if err := tx.Exec(
				"UPDATE tour_seats SET available_seats = available_seats - ? WHERE tour_date_id = ?",
				booking.Seats, booking.TourDateID,
			).Error; err != nil {
				tx.Rollback()
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Failed to reserve seats",
				})
			}
		}

		result := tx.Exec(
			"UPDATE bookings SET status = ? WHERE id = ?",
			newStatus, bookingIDInt,
		)
		if result.Error != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to update booking status",
			})
		}
		if result.RowsAffected == 0 {
			tx.Rollback()
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Booking not found",
			})
		}

		if err := tx.Commit().Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to commit status update",
			})
		}

		if booking.CustomerEmail != "" {
			tourTitle := getTourTitleByBooking(db, booking.ID)
			notif := email.BookingNotification{
				CustomerName: booking.CustomerName,
				TourTitle:    tourTitle,
				Seats:        int(booking.Seats),
				TotalPrice:   booking.TotalPrice,
				BookingID:    booking.ID,
				Status:       newStatus,
			}

			switch newStatus {
			case "confirmed":
				email.NotifyBookingConfirmed(booking.CustomerEmail, notif)
			case "cancelled":
				email.NotifyBookingCancelled(booking.CustomerEmail, notif)
			}

			log.Printf("Email notification queued: booking #%d → %s → %s",
				booking.ID, newStatus, booking.CustomerEmail)
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Booking status updated",
		})
	}
}

func getTourTitleByBooking(db *gorm.DB, bookingID uint) string {
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
