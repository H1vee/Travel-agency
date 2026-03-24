package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

// Seat adjustment logic given DB triggers:
//
//   trg_decrease_seats  BEFORE INSERT  → decrements available_seats
//   trg_restore_seats   AFTER DELETE   → restores available_seats
//
// Triggers fire only on INSERT/DELETE, NOT on UPDATE.
// So status changes that affect seat availability must be handled manually:
//
//   pending/confirmed → cancelled : restore seats manually
//   cancelled → pending/confirmed : decrement seats manually
//   pending ↔ confirmed           : no seat change needed

func UpdateBookingStatus(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		bookingID := c.Param("id")

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
			ID         uint   `gorm:"column:id"`
			TourDateID uint   `gorm:"column:tour_date_id"`
			Seats      uint   `gorm:"column:seats"`
			Status     string `gorm:"column:status"`
		}
		if err := tx.Raw(
			"SELECT id, tour_date_id, seats, status FROM bookings WHERE id = ?",
			bookingID,
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
			newStatus, bookingID,
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

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Booking status updated",
		})
	}
}