package api

import (
	"log"
	"net/http"
	"strconv"

	"tour-server/search/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func SearchTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		searchTitle := c.QueryParam("title")
		searchDuration := c.QueryParam("duration")
		minPriceStr := c.QueryParam("minPrice")
		maxPriceStr := c.QueryParam("maxPrice")
		minRatingStr := c.QueryParam("minRating")
		maxRatingStr := c.QueryParam("maxRating")

		var minPrice, maxPrice, minRating, maxRating int
		var err error

		if minPriceStr != "" {
			minPrice, err = strconv.Atoi(minPriceStr)
			if err != nil {
				log.Println("Помилка конвертації minPrice:", err)
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid minPrice format",
				})
			}
		}

		if maxPriceStr != "" {
			maxPrice, err = strconv.Atoi(maxPriceStr)
			if err != nil {
				log.Println("Помилка конвертації maxPrice:", err)
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid maxPrice format",
				})
			}
		}

		if minRatingStr != "" {
			minRating, err = strconv.Atoi(minRatingStr)
			if err != nil || minRating < 1 || minRating > 5 {
				log.Println("Помилка конвертації minRating:", err)
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid minRating format",
				})
			}
		}

		if maxRatingStr != "" {
			maxRating, err = strconv.Atoi(maxRatingStr)
			if err != nil || maxRating < 1 || maxRating > 5 {
				log.Println("Помилка конвертації maxRating:", err)
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid maxRating format",
				})
			}
		}

		var tours []dto.SearchTour

		query := db.Debug().Table("tours").
			Select("tours.id").
			Joins("JOIN statuses ON tours.status_id = statuses.id").
			Joins("JOIN tour_dates ON tour_dates.tour_id = tours.id").
			Where("1=1")

		if searchTitle != "" {
			query = query.Where("searchable_words ILIKE ?", "%"+searchTitle+"%")
		}
		if minPriceStr != "" {
			query = query.Where("tours.price >= ?", minPrice)
		}
		if maxPriceStr != "" {
			query = query.Where("tours.price <= ?", maxPrice)
		}
		if minRatingStr != "" {
			query = query.Where("tours.rating >= ?", minRating)
		}
		if maxRatingStr != "" {
			query = query.Where("tours.rating <= ?", maxRating)
		}
		if searchDuration != "" {
			query = query.Where("tour_dates.duration = make_interval(days := ?)", searchDuration)
		}

		err = query.Find(&tours).Error
		log.Printf("SQL Query executed: %+v\n", query.Statement.SQL.String())
		log.Printf("Result: %+v\n", tours)

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		return c.JSON(http.StatusOK, tours)
	}
}
