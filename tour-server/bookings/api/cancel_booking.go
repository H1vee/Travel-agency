package api

import (
	"net/http"

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
			ID         uint   `gorm:"column:id"`
			TourDateID uint   `gorm:"column:tour_date_id"`
			Seats      uint   `gorm:"column:seats"`
			Status     string `gorm:"column:status"`
			UserID     *uint  `gorm:"column:user_id"`
		}
		if err := tx.Raw(
			"SELECT id, tour_date_id, seats, status, user_id FROM bookings WHERE id = ?",
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

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Бронювання скасовано",
		})
	}
}