package api

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// GetToursForCardsByID returns an Echo handler function that retrieves tour card information
// for multiple tours specified by their IDs in a query parameter
func GetToursForCardsByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get the comma-separated list of tour IDs from query parameters
		idsParam := c.QueryParam("ids")

		// Check if database connection is valid
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		// Split the comma-separated string into individual ID strings
		idsStr := strings.Split(idsParam, ",")

		// Convert string IDs to integers
		var ids []int
		for _, idStr := range idsStr {
			id, err := strconv.Atoi(idStr)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid id format"})
			}
			ids = append(ids, id)
		}

		// Query the database for basic tour information and card images
		var toursWithImages []dto.TourCard
		err := db.Debug().Table("tours").
			Select("tours.id, tours.title, tours.price, COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src").
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Where("tours.id IN ?", ids).
			Find(&toursWithImages).Error

		// Log the executed SQL query and results for debugging
		log.Printf("SQL Query executed: %+v\n", db.Statement.SQL.String())
		log.Printf("Result: %+v\n", toursWithImages)

		// Handle database errors
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		// Return the tour card information as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, toursWithImages)
	}
}
