package api

import (
	"log"
	"net/http"
	"tour-server/bookings/dto"
	"tour-server/bookings/models"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func PostBookings(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req dto.BookingRequest

		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request"})
		}

		var availableSeats uint
		err := db.Raw("SELECT available_seats FROM tour_seats WHERE tour_date_id = ?", req.TourDateID).
			Scan(&availableSeats).Error
		if err != nil {
			log.Printf("Error checking available seats: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to check available seats"})
		}

		booking := models.Bookings{
			TourDateID:    req.TourDateID,
			CustomerName:  req.CustomerName,
			CustomerEmail: req.CustomerEmail,
			CustomerPhone: req.CustomerPhone,
			Seats:         req.Seats,
			TotalPrice:    req.TotalPrice,
			Status:        "pending",
		}

		if err := db.Create(&booking).Error; err != nil {
			log.Printf("Error creating booking %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to create booking"})
		}
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Booking successful"})
	}
}
