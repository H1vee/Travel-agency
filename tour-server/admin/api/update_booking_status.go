package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

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

		result := db.Table("bookings").
			Where("id = ?", bookingID).
			Update("status", req.Status)

		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to update booking status",
			})
		}

		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Booking not found",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Booking status updated",
		})
	}
}