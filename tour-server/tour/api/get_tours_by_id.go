package api

import (
	"log"
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetTourById returns an Echo handler function that retrieves a specific tour by its ID
// It performs a complex join query to gather all necessary tour information including status,
// dates, duration and available seats
func GetTourById(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Extract the tour ID from the URL parameter
		id := c.Param("id")

		var tour dto.TourDTO

		// Query the database for tour information with related data
		// Using multiple joins to get status, date information, and seat availability
		err := db.Table("tours").Debug().
			Select(`tours.id, tours.title, tours.description,
                tours.call_to_action, tours.price, tours.rating,
                tours.detailed_description, tours.status_id, statuses.name AS status,
                tour_dates.date_from, tour_dates.date_to,
                EXTRACT(DAY FROM (tour_dates.date_to - tour_dates.date_from)) AS duration,
                tours.total_seats,
                COALESCE(tour_seats.available_seats, tours.total_seats) AS available_seats`).
			Joins("JOIN statuses ON tours.status_id = statuses.id").                  // Join for tour status information
			Joins("LEFT JOIN tour_dates ON tours.id = tour_dates.tour_id").           // Left join to include tours without dates
			Joins("LEFT JOIN tour_seats ON tour_dates.id = tour_seats.tour_date_id"). // Left join to get seat availability
			Where("tours.id = ?", id).
			Scan(&tour).Error

		// Handle database errors
		if err != nil {
			log.Printf("Failed to fetch tour: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tour",
			})
		}

		// Return the tour data as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, tour)
	}
}
