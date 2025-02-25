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

		var tours []dto.SearchTour

		query := db.Debug().Table("tours").
			Select("tours.id").
			Joins("JOIN statuses ON tours.status_id = statuses.id").
			Where("1=1")

		if searchTitle != "" {
			query = query.Where("tours.title ILIKE ?", "%"+searchTitle+"%")
		}
		if searchPrice != "" {
			query = query.Where("tours.price = ?", searchPrice)
		}
		if searchRating != "" {
			query = query.Where("tours.rating = ?", searchRating)
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
