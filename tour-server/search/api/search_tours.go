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

func SearchTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
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

		if minPriceStr != "" {
			minPrice, err = strconv.ParseFloat(minPriceStr, 64)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат мінімальної ціни",
				})
			}
		}
		if maxPriceStr != "" {
			maxPrice, err = strconv.ParseFloat(maxPriceStr, 64)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат максимальної ціни",
				})
			}
		}

		if minRatingStr != "" {
			minRating, err = strconv.ParseFloat(minRatingStr, 64)
			if err != nil || minRating < 0 || minRating > 5 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат рейтингу",
				})
			}
		}
		if maxRatingStr != "" {
			maxRating, err = strconv.ParseFloat(maxRatingStr, 64)
			if err != nil || maxRating < 0 || maxRating > 5 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат максимального рейтингу",
				})
			}
		}

		var tours []dto.SearchTourResult
		query := db.Debug().Table("tours").
			Select(`tours.id, tours.title, tours.price, tours.rating, 
				COALESCE(tour_card_images.image_src, '/static/images/no-image.jpg') AS image_src`).
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')")

		if searchTitle != "" {
			query = query.Where("tours.title ILIKE ? OR tours.description ILIKE ?", 
				"%"+searchTitle+"%", "%"+searchTitle+"%")
		}

		if minPriceStr != "" && maxPriceStr != "" {
			query = query.Where("tours.price BETWEEN ? AND ?", minPrice, maxPrice)
		} else if minPriceStr != "" {
			query = query.Where("tours.price >= ?", minPrice)
		} else if maxPriceStr != "" {
			query = query.Where("tours.price <= ?", maxPrice)
		}

		if minRatingStr != "" && maxRatingStr != "" {
			query = query.Where("tours.rating BETWEEN ? AND ?", minRating, maxRating)
		} else if minRatingStr != "" {
			query = query.Where("tours.rating >= ?", minRating)
		} else if maxRatingStr != "" {
			query = query.Where("tours.rating <= ?", maxRating)
		}

		if searchDuration != "" {
			durationDays, err := strconv.Atoi(searchDuration)
			if err == nil {
				query = query.Joins("JOIN tour_dates ON tour_dates.tour_id = tours.id").
					Where("EXTRACT(DAY FROM (tour_dates.date_to - tour_dates.date_from)) <= ?", durationDays).
					Group("tours.id, tours.title, tours.price, tours.rating, tour_card_images.image_src")
			}
		}

		if regionStr != "" {
			regions := strings.Split(regionStr, ",")
			regionNames := make([]string, 0, len(regions))
			
			regionMap := map[string][]string{
				"1": {"Україна", "Ukraine"},
				"2": {"Франція", "Італія", "Іспанія", "Німеччина", "Польща", 
					  "France", "Italy", "Spain", "Germany", "Poland"},
				"3": {"Китай", "Японія", "Таїланд", "В'єтнам", "Індія", 
					  "China", "Japan", "Thailand", "Vietnam", "India"},
				"4": {"США", "Канада", "Мексика", "Бразилія", 
					  "USA", "Canada", "Mexico", "Brazil"},
				"5": {"ОАЕ", "Туреччина", "Єгипет", "Ізраїль", 
					  "UAE", "Turkey", "Egypt", "Israel"},
				"6": {"Австралія", "Нова Зеландія", "Фіджі", 
					  "Australia", "New Zealand", "Fiji"},
			}
			
			for _, regionID := range regions {
				if countries, exists := regionMap[strings.TrimSpace(regionID)]; exists {
					regionNames = append(regionNames, countries...)
				}
			}
			
			if len(regionNames) > 0 {
				query = query.Joins("JOIN tour_dates td ON td.tour_id = tours.id").
					Joins("JOIN locations from_loc ON td.from_location_id = from_loc.id").
					Joins("JOIN locations to_loc ON td.to_location_id = to_loc.id").
					Where("from_loc.country IN ? OR to_loc.country IN ?", regionNames, regionNames).
					Group("tours.id, tours.title, tours.price, tours.rating, tour_card_images.image_src")
			}
		}

		err = query.Find(&tours).Error

		log.Printf("Пошук: назва='%s', регіон='%s', ціна=%v-%v, рейтинг=%v-%v, тривалість='%s'", 
			searchTitle, regionStr, minPrice, maxPrice, minRating, maxRating, searchDuration)
		log.Printf("Знайдено %d турів", len(tours))

		if err != nil {
			log.Printf("Помилка пошуку: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка пошуку турів",
			})
		}

		return c.JSON(http.StatusOK, tours)
	}
}