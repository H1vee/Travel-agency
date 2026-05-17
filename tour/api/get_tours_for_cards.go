package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type TourCardResponse struct {
	ID            uint    `json:"id"`
	Title         string  `json:"title"`
	Price         float64 `json:"price"`
	Rating        float64 `json:"rating"`
	ImageSrc      *string `json:"imageSrc"`
	BookingsCount int     `json:"bookings_count"`
	IsNew         bool    `json:"is_new"`
	IsHit         bool    `json:"is_hit"`
}

func GetToursForCards(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		if db == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database connection is nil"})
		}

		type rawTour struct {
			ID            uint    `gorm:"column:id"`
			Title         string  `gorm:"column:title"`
			Price         float64 `gorm:"column:price"`
			Rating        float64 `gorm:"column:rating"`
			ImageSrc      *string `gorm:"column:image_src"`
			BookingsCount int     `gorm:"column:bookings_count"`
			CreatedAt     string  `gorm:"column:created_at"`
		}

		var tours []rawTour
		err := db.Table("tours").
			Select(`
				tours.id,
				tours.title,
				tours.price,
				tours.rating,
				COALESCE(tour_card_images.image_src, 'no-image.jpg') AS image_src,
				COALESCE((
					SELECT COUNT(*) FROM bookings b
					JOIN tour_dates td ON b.tour_date_id = td.id
					WHERE td.tour_id = tours.id AND b.status IN ('pending','confirmed')
				), 0) AS bookings_count,
				tours.created_at
			`).
			Joins("LEFT JOIN tour_card_images ON tours.id = tour_card_images.tour_id").
			Where("tours.status_id = (SELECT id FROM statuses WHERE name = 'active')").
			Order("tours.id ASC").
			Find(&tours).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch tours"})
		}

		// Визначаємо топ-3 за бронюваннями (хіти)
		type tourWithIdx struct {
			idx   int
			count int
		}
		counts := make([]tourWithIdx, len(tours))
		for i, t := range tours {
			counts[i] = tourWithIdx{i, t.BookingsCount}
		}
		// Сортуємо для визначення хітів
		topN := 3
		hitSet := make(map[int]bool)
		// Simple selection of top-N by bookings_count
		for i := 0; i < topN && i < len(counts); i++ {
			maxIdx := i
			for j := i + 1; j < len(counts); j++ {
				if counts[j].count > counts[maxIdx].count {
					maxIdx = j
				}
			}
			counts[i], counts[maxIdx] = counts[maxIdx], counts[i]
			if counts[i].count > 0 {
				hitSet[counts[i].idx] = true
			}
		}

		// Визначаємо новинки — тури додані за останні 30 днів або топ-3 за id
		newSet := make(map[uint]bool)
		if len(tours) > 0 {
			// Беремо 3 тури з найбільшим id як "нові"
			maxIDs := make([]uint, 0, 3)
			for _, t := range tours {
				maxIDs = append(maxIDs, t.ID)
			}
			// Sort descending to find newest
			for i := 0; i < 3 && i < len(maxIDs); i++ {
				maxIdx := i
				for j := i + 1; j < len(maxIDs); j++ {
					if maxIDs[j] > maxIDs[maxIdx] {
						maxIdx = j
					}
				}
				maxIDs[i], maxIDs[maxIdx] = maxIDs[maxIdx], maxIDs[i]
				newSet[maxIDs[i]] = true
			}
		}

		result := make([]TourCardResponse, len(tours))
		for i, t := range tours {
			result[i] = TourCardResponse{
				ID:            t.ID,
				Title:         t.Title,
				Price:         t.Price,
				Rating:        t.Rating,
				ImageSrc:      t.ImageSrc,
				BookingsCount: t.BookingsCount,
				IsNew:         newSet[t.ID],
				IsHit:         hitSet[i],
			}
		}

		return c.JSON(http.StatusOK, result)
	}
}