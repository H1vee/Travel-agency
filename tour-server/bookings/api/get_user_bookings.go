package api

import (
	"net/http"
	"tour-server/bookings/dto"
	"tour-server/bookings/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetUserBookings(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		var bookings []models.Bookings

		if err := db.Preload("TourDate.Tour").Preload("TourDate.FromLocation").Preload("TourDate.ToLocation").
			Where("user_id = ?", userID).
			Order("created_at DESC").
			Find(&bookings).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch bookings",
			})
		}

		var response []dto.BookingResponse
		for _, booking := range bookings {
			bookingDTO := dto.BookingResponse{
				ID:            booking.ID,
				TourTitle:     booking.TourDate.Tour.Title,
				CustomerName:  booking.CustomerName,
				CustomerEmail: booking.CustomerEmail,
				CustomerPhone: booking.CustomerPhone,
				Seats:         booking.Seats,
				TotalPrice:    booking.TotalPrice,
				Status:        booking.Status,
				BookedAt:      booking.BookedAt,
			}

			if booking.TourDate.FromLocation != nil {
				bookingDTO.FromLocation = booking.TourDate.FromLocation.Name
			}
			if booking.TourDate.ToLocation != nil {
				bookingDTO.ToLocation = booking.TourDate.ToLocation.Name
			}

			bookingDTO.DateFrom = booking.TourDate.DateFrom
			bookingDTO.DateTo = booking.TourDate.DateTo

			response = append(response, bookingDTO)
		}

		return c.JSON(http.StatusOK, response)
	}
}
