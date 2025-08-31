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
		log.Println("PostBookings triggered")

		var req dto.BookingRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request"})
		}

		var userID *uint
		var isGuestBooking bool

		if userIDValue := c.Get("user_id"); userIDValue != nil {
			if uid, ok := userIDValue.(uint); ok && uid > 0 {
				userID = &uid
				isGuestBooking = false
				log.Printf("🔹 Authenticated user ID: %d\n", uid)
			} else {
				userID = nil
				isGuestBooking = true
				log.Println("🔹 Failed to get user_id, creating guest booking")
			}
		} else {
			userID = nil
			isGuestBooking = true
			log.Println("🔹 Guest booking - no user_id in context")
		}

		var availableSeats uint
		err := db.Raw("SELECT available_seats FROM tour_seats WHERE tour_date_id = ?", req.TourDateID).
			Scan(&availableSeats).Error
		log.Printf("🔹 Available seats for tour_date_id %d: %d\n", req.TourDateID, availableSeats)

		if err != nil {
			log.Printf("Error checking available seats: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to check available seats"})
		}

		if availableSeats < uint(req.Seats) {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Not enough available seats"})
		}

		booking := models.Bookings{
			TourDateID:     req.TourDateID,
			CustomerName:   req.CustomerName,
			CustomerEmail:  req.CustomerEmail,
			CustomerPhone:  req.CustomerPhone,
			Seats:          req.Seats,
			TotalPrice:     req.TotalPrice,
			Status:         "pending",
			UserID:         userID,
			IsGuestBooking: isGuestBooking,
		}

		log.Printf("Creating booking: UserID=%v, IsGuest=%v, tour_date_id=%d",
			userID, isGuestBooking, booking.TourDateID)

		if err := db.Debug().Create(&booking).Error; err != nil {
			log.Printf("Error creating booking %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to create booking"})
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message":    "Booking successful",
			"booking_id": booking.ID,
			"is_guest":   isGuestBooking,
		})
	}
}
