package api

import (
	"log"
	"net/http"
	"tour-server/tourseats/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetTourSeatsByTourID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")
		var tourSeats []dto.TourSeatsDTO

		err := db.Table("tour_seats").Debug().
			Select("tour_seats.id, tour_seats.tour_date_id, tour_seats.available_seats").
			Joins("JOIN tour_dates ON tour_seats.tour_date_id = tour_dates.id").
			Where("tour_dates.tour_id =?", tourID).
			Scan(&tourSeats).Error

		if err != nil {
			log.Printf("Failed to fetch tour seats.: %v\n", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch available seats",
			})
		}
		return c.JSON(http.StatusOK, tourSeats)
	}

}
