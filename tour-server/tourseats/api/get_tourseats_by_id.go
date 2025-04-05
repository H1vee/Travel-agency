package api

import (
	"log"
	"net/http"
	"tour-server/tourseats/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetTourSeatsByTourID returns an Echo handler function that retrieves seat availability
// information for all dates of a specific tour identified by its ID
func GetTourSeatsByTourID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Extract the tour ID from the URL parameter
		tourID := c.Param("id")

		// Query the database for seat availability across all dates for this tour
		var tourSeats []dto.TourSeatsDTO
		err := db.Table("tour_seats").Debug().
			Select("tour_seats.id, tour_seats.tour_date_id, tour_seats.available_seats, tours.price").
			Joins("JOIN tour_dates ON tour_seats.tour_date_id = tour_dates.id"). // Join to get date information
			Joins("JOIN tours ON tour_dates.tour_id = tours.id").                // Join to get tour price
			Where("tour_dates.tour_id =?", tourID).                              // Filter by the specified tour ID
			Scan(&tourSeats).Error

		// Handle database errors
		if err != nil {
			log.Printf("Failed to fetch tour seats: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch available seats",
			})
		}

		// Return the seat availability data as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, tourSeats)
	}
}
