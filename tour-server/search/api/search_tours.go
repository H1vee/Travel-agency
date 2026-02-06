// tour-server/search/api/search_tours.go

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
		searchTitle := strings.TrimSpace(c.QueryParam("title"))
		minDurationStr := c.QueryParam("minDuration")
		maxDurationStr := c.QueryParam("maxDuration")
		minPriceStr := c.QueryParam("minPrice")
		maxPriceStr := c.QueryParam("maxPrice")
		ratingsStr := c.QueryParam("ratings")
		regionStr := c.QueryParam("region")
		pageStr := c.QueryParam("page")
		limitStr := c.QueryParam("limit")
		sortBy := c.QueryParam("sortBy")

		var minPrice, maxPrice float64
		var minDuration, maxDuration int
		var page, limit int = 1, 20
		var err error

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

		if minPriceStr != "" && maxPriceStr != "" && minPrice > maxPrice {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Мінімальна ціна не може бути більшою за максимальну",
			})
		}
		if minDurationStr != "" && maxDurationStr != "" && minDuration > maxDuration {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Мінімальна тривалість не може бути більшою за максимальну",
			})
		}

		var allTours []dto.SearchTourResult
		var totalCount int64

		baseQuery := db.Table("tours").
			Select(`tours.id, 
				tours.title, 
				tours.price, 
				tours.rating, 
				COALESCE((SELECT image_src FROM tour_card_images WHERE tour_id = tours.id LIMIT 1), '/static/images/no-image.jpg') AS image_src,
				(SELECT EXTRACT(DAY FROM duration) FROM tour_dates WHERE tour_id = tours.id LIMIT 1) AS duration,
				(SELECT CONCAT(l.name, ', ', l.country) FROM tour_dates td 
					JOIN locations l ON td.to_location_id = l.id 
					WHERE td.tour_id = tours.id LIMIT 1) AS location,
				(SELECT country FROM tour_dates td 
					JOIN locations l ON td.to_location_id = l.id 
					WHERE td.tour_id = tours.id LIMIT 1) AS region`).
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')")

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

		if ratingsStr != "" {
			ratingsList := strings.Split(ratingsStr, ",")
			if len(ratingsList) > 0 {
				var ratingConditions []string
				var ratingValues []interface{}
				
				for _, ratingStr := range ratingsList {
					rating, err := strconv.Atoi(strings.TrimSpace(ratingStr))
					if err != nil || rating < 1 || rating > 5 {
						continue
					}
					
					if rating == 5 {
						ratingConditions = append(ratingConditions, "tours.rating >= ?")
						ratingValues = append(ratingValues, 5.0)
					} else {
						ratingConditions = append(ratingConditions, "(tours.rating >= ? AND tours.rating < ?)")
						ratingValues = append(ratingValues, float64(rating), float64(rating+1))
					}
				}
				
				if len(ratingConditions) > 0 {
					baseQuery = baseQuery.Where("("+strings.Join(ratingConditions, " OR ")+")", ratingValues...)
				}
			}
		}

		if minDurationStr != "" && maxDurationStr != "" {
			baseQuery = baseQuery.Where(
				"EXISTS (SELECT 1 FROM tour_dates WHERE tour_id = tours.id AND EXTRACT(DAY FROM duration) BETWEEN ? AND ?)",
				minDuration, maxDuration)
		} else if minDurationStr != "" {
			baseQuery = baseQuery.Where(
				"EXISTS (SELECT 1 FROM tour_dates WHERE tour_id = tours.id AND EXTRACT(DAY FROM duration) >= ?)",
				minDuration)
		} else if maxDurationStr != "" {
			baseQuery = baseQuery.Where(
				"EXISTS (SELECT 1 FROM tour_dates WHERE tour_id = tours.id AND EXTRACT(DAY FROM duration) <= ?)",
				maxDuration)
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
				baseQuery = baseQuery.Where(
					"EXISTS (SELECT 1 FROM tour_dates td JOIN locations l ON td.to_location_id = l.id WHERE td.tour_id = tours.id AND l.country IN ?)",
					regionNames)
			}
		}

		countQuery := baseQuery
		err = countQuery.Count(&totalCount).Error
		if err != nil {
			log.Printf("Помилка підрахунку: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка підрахунку результатів",
			})
		}

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

		offset := (page - 1) * limit
		baseQuery = baseQuery.Offset(offset).Limit(limit)

		err = baseQuery.Find(&allTours).Error
		if err != nil {
			log.Printf("Помилка пошуку: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Помилка пошуку турів",
			})
		}

		// Видаляємо дублікати
		seen := make(map[uint]bool)
		tours := make([]dto.SearchTourResult, 0, len(allTours))
		
		for _, tour := range allTours {
			if !seen[tour.ID] {
				seen[tour.ID] = true
				tours = append(tours, tour)
			}
		}

		log.Printf("Знайдено: %d рядків, унікальних: %d", len(allTours), len(tours))
		for i, tour := range tours {
			log.Printf("  %d. %s (ID: %d, Price: %.2f)", i+1, tour.Title, tour.ID, tour.Price)
		}

		totalPages := int((totalCount + int64(limit) - 1) / int64(limit))
		
		appliedFilters := dto.SearchFilters{
			Title:       searchTitle,
			MinPrice:    parseFloatPtr(minPriceStr),
			MaxPrice:    parseFloatPtr(maxPriceStr),
			MinDuration: parseIntPtr(minDurationStr),
			MaxDuration: parseIntPtr(maxDurationStr),
		}
		
		if regionStr != "" {
			appliedFilters.Regions = strings.Split(regionStr, ",")
		}
		
		if ratingsStr != "" {
			appliedFilters.Ratings = strings.Split(ratingsStr, ",")
		}
		
		response := dto.SearchResponse{
			Tours:      tours,
			Total:      int(totalCount),
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
			Filters:    appliedFilters,
		}

		c.Response().Header().Set("X-Total-Count", strconv.Itoa(int(totalCount)))
		c.Response().Header().Set("X-Total-Pages", strconv.Itoa(totalPages))
		c.Response().Header().Set("X-Current-Page", strconv.Itoa(page))
		c.Response().Header().Set("X-Per-Page", strconv.Itoa(limit))

		return c.JSON(http.StatusOK, response)
	}
}

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