package api

import (
	"log"
	"net/http"
	"tour-server/search/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func SearchTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		searchTitle := c.QueryParam("title")
		searchPrice := c.QueryParam("price")
		searchRating := c.QueryParam("rating")
		searchDuration := c.QueryParam("duration")

		var tours []dto.SearchTour

		query := db.Debug().Table("tours").
			Select("tours.id").
			Joins("JOIN statuses ON tours.status_id = statuses.id").
			Joins("JOIN tour_dates ON tour_dates.tour_id = tours.id").
			Where("1=1")

		if searchTitle != "" {
			query = query.Where("searchable_words ILIKE ?", "%"+searchTitle+"%")
		}
		if searchPrice != "" {
			query = query.Where("tours.price = ?", searchPrice)
		}
		if searchRating != "" {
			query = query.Where("tours.rating = ?", searchRating)
		}
		if searchDuration != "" {
			query = query.Where("tour_dates.duration =make_interval(days := ?)", searchDuration)
		}

		err := query.Find(&tours).Error
		log.Printf("SQL Query executed: %+v\n", db.Statement.SQL.String())
		log.Printf("Result: %+v\n", tours)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		return c.JSON(http.StatusOK, tours)
	}
}
