package api

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"tour-server/search/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// SearchTours returns an Echo handler function that searches for tours based on
// various filtering criteria provided as query parameters
func SearchTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Extract all search parameters from query string
		searchTitle := c.QueryParam("title")
		searchDuration := c.QueryParam("duration")
		minPriceStr := c.QueryParam("minPrice")
		maxPriceStr := c.QueryParam("maxPrice")
		minRatingStr := c.QueryParam("minRating")
		maxRatingStr := c.QueryParam("maxRating")
		regionStr := c.QueryParam("region")

		var minPrice, maxPrice float64
		var minRating, maxRating float64
		var err error

		// Parse and validate price range parameters
		// Price parsing
		if minPriceStr != "" {
			minPrice, err = strconv.ParseFloat(minPriceStr, 64)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid minPrice format",
				})
			}
		}
		if maxPriceStr != "" {
			maxPrice, err = strconv.ParseFloat(maxPriceStr, 64)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid maxPrice format",
				})
			}
		}

		// Parse and validate rating range parameters (must be between 0 and 5)
		// Rating parsing
		if minRatingStr != "" {
			minRating, err = strconv.ParseFloat(minRatingStr, 64)
			if err != nil || minRating < 0 || minRating > 5 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid minRating format",
				})
			}
		}
		if maxRatingStr != "" {
			maxRating, err = strconv.ParseFloat(maxRatingStr, 64)
			if err != nil || maxRating < 0 || maxRating > 5 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid maxRating format",
				})
			}
		}

		// Initialize query with required joins for tour locations
		var tours []dto.SearchTour
		query := db.Debug().Table("tours").
			Select("DISTINCT tours.id").
			Joins("JOIN tour_dates ON tour_dates.tour_id = tours.id").
			Joins("JOIN locations from_loc ON tour_dates.from_location_id = from_loc.id").
			Joins("JOIN locations to_loc ON tour_dates.to_location_id = to_loc.id").
			Where("1=1") // Starting condition that's always true

		// Add title search filter if provided (case insensitive)
		if searchTitle != "" {
			query = query.Where("tours.title ILIKE ?", "%"+searchTitle+"%")
		}

		// Add region filter if provided (matches either departure or arrival regions)
		if regionStr != "" {
			regionIDs := strings.Split(regionStr, ",")
			query = query.Where("from_loc.region_id IN ? OR to_loc.region_id IN ?", regionIDs, regionIDs)
		}

		// Add price range filters based on provided parameters
		if minPriceStr != "" && maxPriceStr != "" {
			query = query.Where("tours.price BETWEEN ? AND ?", minPrice, maxPrice)
		} else if minPriceStr != "" {
			query = query.Where("tours.price >= ?", minPrice)
		} else if maxPriceStr != "" {
			query = query.Where("tours.price <= ?", maxPrice)
		}

		// Add rating range filters based on provided parameters
		if minRatingStr != "" && maxRatingStr != "" {
			query = query.Where("tours.rating BETWEEN ? AND ?", minRating, maxRating)
		} else if minRatingStr != "" {
			query = query.Where("tours.rating >= ?", minRating)
		} else if maxRatingStr != "" {
			query = query.Where("tours.rating <= ?", maxRating)
		}

		// Add duration filter if provided (using PostgreSQL's make_interval function)
		if searchDuration != "" {
			query = query.Where("tour_dates.duration = make_interval(days := ?)", searchDuration)
		}

		// Execute the query
		err = query.Find(&tours).Error

		// Log all search parameters and the resulting query for debugging
		log.Printf("Search Parameters:")
		log.Printf("Title: %s", searchTitle)
		log.Printf("Region: %s", regionStr)
		log.Printf("Price Range: %f - %f", minPrice, maxPrice)
		log.Printf("Rating Range: %f - %f", minRating, maxRating)
		log.Printf("Duration: %s", searchDuration)
		log.Printf("Full SQL Query: %s", query.Statement.SQL.String())
		log.Printf("Query Parameters: %+v", query.Statement.Vars)

		// Handle database errors
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		// Return the search results as JSON with HTTP 200 OK status
		return c.JSON(http.StatusOK, tours)
	}
}
