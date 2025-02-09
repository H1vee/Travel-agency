package api

import (
	"log"
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetTourById(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")
		var tour dto.TourDTO

		err := db.Table("tours").Debug().
			Select(`tours.id, tours.title, tours.description, 
				tours.call_to_action, tours.price, tours.rating, 
				tours.detailed_description, tours.status_id, statuses.name as status,
				tour_dates.date_from, tour_dates.date_to, 
				EXTRACT(DAY FROM (tour_dates.date_to - tour_dates.date_from)) AS duration`).
			Joins("JOIN statuses ON tours.status_id = statuses.id").
			Joins("LEFT JOIN tour_dates ON tours.id = tour_dates.tour_id").
			Where("tours.id = ?", id).
			Scan(&tour).Error

		if err != nil {
			log.Printf("Failed to fetch tour: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tour",
			})
		}

		return c.JSON(http.StatusOK, tour)
	}
}
