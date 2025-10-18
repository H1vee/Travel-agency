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
		minDurationStr := c.QueryParam("minDuration")
		maxDurationStr := c.QueryParam("maxDuration")
		minPriceStr := c.QueryParam("minPrice")
		maxPriceStr := c.QueryParam("maxPrice")
		minRatingStr := c.QueryParam("minRating")
		maxRatingStr := c.QueryParam("maxRating")
		regionStr := c.QueryParam("region")
		pageStr := c.QueryParam("page")
		limitStr := c.QueryParam("limit")
		sortBy := c.QueryParam("sortBy")

		var minPrice, maxPrice float64
		var minRating, maxRating float64
		var minDuration, maxDuration int
		var page, limit int = 1, 20
		var err error

		// Парсинг параметрів
		if pageStr != "" {
			page, err = strconv.Atoi(pageStr)
			if err != nil || page < 1 {
				page = 1
			}
		}
		if limitStr != "" {
			limit, err = strconv.Atoi(limitStr)
			if err != nil || limit < 1 || limit > 100 {
				limit = 20
			}
		}

		if minPriceStr != "" {
			minPrice, err = strconv.ParseFloat(minPriceStr, 64)
			if err != nil || minPrice < 0 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат мінімальної ціни",
				})
			}
		}
		if maxPriceStr != "" {
			maxPrice, err = strconv.ParseFloat(maxPriceStr, 64)
			if err != nil || maxPrice < 0 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат максимальної ціни",
				})
			}
		}

		if minRatingStr != "" {
			minRating, err = strconv.ParseFloat(minRatingStr, 64)
			if err != nil || minRating < 0 || minRating > 5 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат мінімального рейтингу (0-5)",
				})
			}
		}
		if maxRatingStr != "" {
			maxRating, err = strconv.ParseFloat(maxRatingStr, 64)
			if err != nil || maxRating < 0 || maxRating > 5 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат максимального рейтингу (0-5)",
				})
			}
		}

		if minDurationStr != "" {
			minDuration, err = strconv.Atoi(minDurationStr)
			if err != nil || minDuration < 1 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат мінімальної тривалості (дні)",
				})
			}
		}
		if maxDurationStr != "" {
			maxDuration, err = strconv.Atoi(maxDurationStr)
			if err != nil || maxDuration < 1 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": "Неправильний формат максимальної тривалості (дні)",
				})
			}
		}

		// Перевірка логічності діапазонів
		if minPriceStr != "" && maxPriceStr != "" && minPrice > maxPrice {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Мінімальна ціна не може бути більшою за максимальну",
			})
		}
		if minRatingStr != "" && maxRatingStr != "" && minRating > maxRating {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Мінімальний рейтинг не може бути більшим за максимальний",
			})
		}
		if minDurationStr != "" && maxDurationStr != "" && minDuration > maxDuration {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Мінімальна тривалість не може бути більшою за максимальну",
			})
		}

		var tours []dto.SearchTourResult
		var totalCount int64

		// Базовий запит
		baseQuery := db.Table("tours").
			Select(`DISTINCT tours.id, tours.title, tours.price, tours.rating, 
				COALESCE(tour_card_images.image_src, '/static/images/no-image.jpg') AS image_src,
				EXTRACT(DAY FROM tour_dates.duration) AS duration,
				CONCAT(to_loc.name, ', ', to_loc.country) AS location,
				to_loc.country AS region`).
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Joins("LEFT JOIN tour_dates ON tour_dates.tour_id = tours.id").
			Joins("LEFT JOIN locations to_loc ON tour_dates.to_location_id = to_loc.id").
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')")

		// Застосування фільтрів
		if searchTitle != "" {
			baseQuery = baseQuery.Where("tours.title ILIKE ? OR tours.description ILIKE ?", 
				"%"+searchTitle+"%", "%"+searchTitle+"%")
		}

		if minPriceStr != "" && maxPriceStr != "" {
			baseQuery = baseQuery.Where("tours.price BETWEEN ? AND ?", minPrice, maxPrice)
		} else if minPriceStr != "" {
			baseQuery = baseQuery.Where("tours.price >= ?", minPrice)
		} else if maxPriceStr != "" {
			baseQuery = baseQuery.Where("tours.price <= ?", maxPrice)
		}

		if minRatingStr != "" && maxRatingStr != "" {
			baseQuery = baseQuery.Where("tours.rating BETWEEN ? AND ?", minRating, maxRating)
		} else if minRatingStr != "" {
			baseQuery = baseQuery.Where("tours.rating >= ?", minRating)
		} else if maxRatingStr != "" {
			baseQuery = baseQuery.Where("tours.rating <= ?", maxRating)
		}

		if minDurationStr != "" && maxDurationStr != "" {
			baseQuery = baseQuery.Where("EXTRACT(DAY FROM tour_dates.duration) BETWEEN ? AND ?", 
				minDuration, maxDuration)
		} else if minDurationStr != "" {
			baseQuery = baseQuery.Where("EXTRACT(DAY FROM tour_dates.duration) >= ?", minDuration)
		} else if maxDurationStr != "" {
			baseQuery = baseQuery.Where("EXTRACT(DAY FROM tour_dates.duration) <= ?", maxDuration)
		}

		if regionStr != "" {
			regions := strings.Split(regionStr, ",")
			regionNames := make([]string, 0, len(regions))
			
			regionMap := map[string][]string{
				"1": {"Україна", "Ukraine"},
				"2": {"Франція", "Італія", "Іспанія", "Німеччина", "Польща", "Нідерланди", "Бельгія", "Швейцарія", "Австрія", "Чехія",
					  "France", "Italy", "Spain", "Germany", "Poland", "Netherlands", "Belgium", "Switzerland", "Austria", "Czech Republic"},
				"3": {"Китай", "Японія", "Таїланд", "В'єтнам", "Індія", "Південна Корея", "Сінгапур", "Малайзія", "Індонезія", "Філіппіни",
					  "China", "Japan", "Thailand", "Vietnam", "India", "South Korea", "Singapore", "Malaysia", "Indonesia", "Philippines"},
				"4": {"США", "Канада", "Мексика", "Бразилія", "Аргентина", "Чилі", "Перу", "Колумбія",
					  "USA", "United States", "Canada", "Mexico", "Brazil", "Argentina", "Chile", "Peru", "Colombia"},
				"5": {"ОАЕ", "Туреччина", "Єгипет", "Ізраїль", "Йорданія", "Саудівська Аравія", "Катар", "Кувейт",
					  "UAE", "Turkey", "Egypt", "Israel", "Jordan", "Saudi Arabia", "Qatar", "Kuwait"},
				"6": {"Австралія", "Нова Зеландія", "Фіджі", "Папуа-Нова Гвінея", "Вануату",
					  "Australia", "New Zealand", "Fiji", "Papua New Guinea", "Vanuatu"},
			}
			
			for _, regionID := range regions {
				if countries, exists := regionMap[strings.TrimSpace(regionID)]; exists {
					regionNames = append(regionNames, countries...)
				}
			}
			
			if len(regionNames) > 0 {
				baseQuery = baseQuery.Where("to_loc.country IN ?", regionNames)
			}
		}

		// Підрахунок загальної кількості
		countQuery := baseQuery
		err = countQuery.Count(&totalCount).Error
		if err != nil {
			log.Printf("Помилка підрахунку: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка підрахунку результатів",
			})
		}

		// Сортування
		switch sortBy {
		case "price_asc":
			baseQuery = baseQuery.Order("tours.price ASC")
		case "price_desc":
			baseQuery = baseQuery.Order("tours.price DESC")
		case "rating_desc":
			baseQuery = baseQuery.Order("tours.rating DESC")
		case "title_asc":
			baseQuery = baseQuery.Order("tours.title ASC")
		case "newest":
			baseQuery = baseQuery.Order("tours.id DESC")
		default:
			baseQuery = baseQuery.Order("tours.rating DESC, tours.price ASC")
		}

		// Пагінація
		offset := (page - 1) * limit
		baseQuery = baseQuery.Offset(offset).Limit(limit)

		// Виконання запиту
		err = baseQuery.Find(&tours).Error
		if err != nil {
			log.Printf("Помилка пошуку: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка пошуку турів",
			})
		}

		// Формування відповіді
		totalPages := int((totalCount + int64(limit) - 1) / int64(limit))
		
		response := dto.SearchResponse{
			Tours: tours,
			Total: int(totalCount),
			Page:  page,
			Limit: limit,
			TotalPages: totalPages,
			Filters: dto.SearchFilters{
				Title:       searchTitle,
				MinPrice:    parseFloatPtr(minPriceStr),
				MaxPrice:    parseFloatPtr(maxPriceStr),
				MinRating:   parseFloatPtr(minRatingStr),
				MaxRating:   parseFloatPtr(maxRatingStr),
				MinDuration: parseIntPtr(minDurationStr),
				MaxDuration: parseIntPtr(maxDurationStr),
				Regions:     strings.Split(regionStr, ","),
			},
		}

		// Метадані в заголовках (правильний метод для Echo)
		c.Response().Header().Set("X-Total-Count", strconv.Itoa(int(totalCount)))
		c.Response().Header().Set("X-Total-Pages", strconv.Itoa(totalPages))
		c.Response().Header().Set("X-Current-Page", strconv.Itoa(page))
		c.Response().Header().Set("X-Per-Page", strconv.Itoa(limit))

		log.Printf("Пошук виконано: знайдено %d з %d турів (сторінка %d/%d)", 
			len(tours), totalCount, page, totalPages)

		return c.JSON(http.StatusOK, response)
	}
}

// Допоміжні функції
func parseFloatPtr(s string) *float64 {
	if s == "" {
		return nil
	}
	if val, err := strconv.ParseFloat(s, 64); err == nil {
		return &val
	}
	return nil
}

func parseIntPtr(s string) *int {
	if s == "" {
		return nil
	}
	if val, err := strconv.Atoi(s); err == nil {
		return &val
	}
	return nil
}