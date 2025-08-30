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

		if err := db.Preload("TourDate.Tour").
			Preload("TourDate.FromLocation").
			Preload("TourDate.ToLocation").
			Where("user_id = ?", userID).
			Order("booked_at DESC").
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
				Seats:         int(booking.Seats),
				TotalPrice:    booking.TotalPrice,
				Status:        booking.Status,
				BookedAt:      booking.BookedAt,
				DateFrom:      booking.TourDate.DateFrom,
				DateTo:        booking.TourDate.DateTo,
			}

			if booking.TourDate.FromLocation.ID != 0 {
				bookingDTO.FromLocation = booking.TourDate.FromLocation.Name
			}
			if booking.TourDate.ToLocation.ID != 0 {
				bookingDTO.ToLocation = booking.TourDate.ToLocation.Name
			}

			response = append(response, bookingDTO)
		}

		return c.JSON(http.StatusOK, response)
	}
}
