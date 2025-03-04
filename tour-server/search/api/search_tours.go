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
		searchRating := c.QueryParam("rating")
		searchDuration := c.QueryParam("duration")

		// Получаем minPrice и maxPrice, но сначала проверяем их
		minPriceStr := c.QueryParam("minPrice")
		maxPriceStr := c.QueryParam("maxPrice")

		// Конвертация строк в числа
		var minPrice, maxPrice int
		var err error

		if minPriceStr != "" {
			minPrice, err = strconv.Atoi(minPriceStr)
			if err != nil {
				log.Println("Ошибка конвертации minPrice:", err)
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid minPrice format",
				})
			}
		}

		if maxPriceStr != "" {
			maxPrice, err = strconv.Atoi(maxPriceStr)
			if err != nil {
				log.Println("Ошибка конвертации maxPrice:", err)
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Invalid maxPrice format",
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
		if searchRating != "" {
			query = query.Where("tours.rating = ?", searchRating)
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
