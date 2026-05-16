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

		paymentStatuses := make(map[uint]string, len(bookings))
		if len(bookings) > 0 {
			ids := make([]uint, 0, len(bookings))
			for _, b := range bookings {
				ids = append(ids, b.ID)
			}
			var rows []struct {
				ID            uint   `gorm:"column:id"`
				PaymentStatus string `gorm:"column:payment_status"`
			}
			db.Raw("SELECT id, COALESCE(payment_status, 'pending') AS payment_status FROM bookings WHERE id IN ?", ids).Scan(&rows)
			for _, r := range rows {
				paymentStatuses[r.ID] = r.PaymentStatus
			}
		}

		var response []dto.BookingResponse
		for _, booking := range bookings {
			bookingDTO := dto.BookingResponse{
				ID:            booking.ID,
				TourID:        booking.TourDate.TourID,
				TourTitle:     booking.TourDate.Tour.Title,
				CustomerName:  booking.CustomerName,
				CustomerEmail: booking.CustomerEmail,
				CustomerPhone: booking.CustomerPhone,
				Seats:         int(booking.Seats),
				TotalPrice:    booking.TotalPrice,
				Status:        booking.Status,
				PaymentStatus: paymentStatuses[booking.ID],
				BookedAt:      booking.BookedAt,
				DateFrom:      booking.TourDate.DateFrom,
				DateTo:        booking.TourDate.DateTo,
			}
			if bookingDTO.PaymentStatus == "" {
				bookingDTO.PaymentStatus = "pending"
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
