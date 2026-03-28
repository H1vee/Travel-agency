package api

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// POST /tour-ratings
// Body: { "tour_id": 3, "rating": 4.5 }
func PostTourRating(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		var req struct {
			TourID uint    `json:"tour_id"`
			Rating float64 `json:"rating"`
		}
		if err := c.Bind(&req); err != nil || req.TourID == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "tour_id та rating обов'язкові"})
		}
		if req.Rating < 1 || req.Rating > 5 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "rating має бути від 1 до 5"})
		}

		// Перевіряємо чи є підтверджене бронювання
		var count int64
		db.Raw(`
			SELECT COUNT(*) FROM bookings b
			JOIN tour_dates td ON b.tour_date_id = td.id
			WHERE td.tour_id = ? AND b.user_id = ? AND b.status = 'confirmed'
		`, req.TourID, userID).Scan(&count)

		if count == 0 {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "Оцінити тур можна тільки після підтвердженого бронювання",
			})
		}

		// Upsert рейтингу
		now := time.Now()
		err := db.Exec(`
			INSERT INTO tour_ratings (tour_id, user_id, rating, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT (tour_id, user_id) DO UPDATE
			SET rating = EXCLUDED.rating, updated_at = EXCLUDED.updated_at
		`, req.TourID, userID, req.Rating, now, now).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Помилка збереження оцінки"})
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Оцінку збережено",
			"rating":  req.Rating,
		})
	}
}

// GET /tour-ratings/:tour_id/my
// Повертає оцінку поточного юзера для туру
func GetMyTourRating(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)
		tourID := c.Param("tour_id")

		var rating float64
		err := db.Raw(`
			SELECT rating FROM tour_ratings
			WHERE tour_id = ? AND user_id = ?
		`, tourID, userID).Scan(&rating).Error

		if err != nil || rating == 0 {
			return c.JSON(http.StatusOK, map[string]interface{}{"rating": nil})
		}

		return c.JSON(http.StatusOK, map[string]interface{}{"rating": rating})
	}
}