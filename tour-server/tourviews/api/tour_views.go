package api

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// POST /tour-views/:tour_id
// Records that the authenticated user viewed a tour.
// Uses UPSERT: if the user already viewed this tour, updates viewed_at and increments view_count.
func RecordTourView(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		tourID, err := strconv.Atoi(c.Param("tour_id"))
		if err != nil || tourID <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Невірний tour_id",
			})
		}

		// Verify tour exists
		var exists int64
		db.Raw("SELECT COUNT(*) FROM tours WHERE id = ?", tourID).Scan(&exists)
		if exists == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Тур не знайдено",
			})
		}

		// Upsert: insert or update viewed_at + increment view_count
		err = db.Exec(`
			INSERT INTO tour_views (user_id, tour_id, viewed_at, view_count)
			VALUES (?, ?, NOW(), 1)
			ON CONFLICT (user_id, tour_id) DO UPDATE
			SET viewed_at = NOW(),
			    view_count = tour_views.view_count + 1
		`, userID, tourID).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Не вдалося зберегти перегляд",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "ok",
		})
	}
}

// GET /tour-views?limit=10
// Returns the authenticated user's recently viewed tours with card info.
func GetRecentViews(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		limit, _ := strconv.Atoi(c.QueryParam("limit"))
		if limit <= 0 || limit > 50 {
			limit = 10
		}

		type ViewedTour struct {
			TourID    uint    `json:"tour_id" gorm:"column:tour_id"`
			Title     string  `json:"title" gorm:"column:title"`
			Price     float64 `json:"price" gorm:"column:price"`
			Rating    float64 `json:"rating" gorm:"column:rating"`
			ImageSrc  string  `json:"image_src" gorm:"column:image_src"`
			ViewedAt  string  `json:"viewed_at" gorm:"column:viewed_at"`
			ViewCount int     `json:"view_count" gorm:"column:view_count"`
		}

		var views []ViewedTour
		err := db.Raw(`
			SELECT
				tv.tour_id,
				t.title,
				t.price,
				t.rating,
				COALESCE(tci.image_src, '/static/images/no-image.jpg') AS image_src,
				tv.viewed_at,
				tv.view_count
			FROM tour_views tv
			JOIN tours t ON tv.tour_id = t.id
			LEFT JOIN tour_card_images tci ON tci.tour_id = t.id
			WHERE tv.user_id = ?
			  AND t.status_id = (SELECT id FROM statuses WHERE name = 'active')
			ORDER BY tv.viewed_at DESC
			LIMIT ?
		`, userID, limit).Scan(&views).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Не вдалося завантажити історію переглядів",
			})
		}

		if views == nil {
			views = []ViewedTour{}
		}

		return c.JSON(http.StatusOK, views)
	}
}

// DELETE /tour-views
// Clears all view history for the authenticated user.
func ClearViewHistory(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		if err := db.Exec("DELETE FROM tour_views WHERE user_id = ?", userID).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Не вдалося очистити історію",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Історію переглядів очищено",
		})
	}
}

// DELETE /tour-views/:tour_id
// Removes a single tour from view history.
func RemoveFromViewHistory(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID := c.Get("user_id").(uint)

		tourID, err := strconv.Atoi(c.Param("tour_id"))
		if err != nil || tourID <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Невірний tour_id",
			})
		}

		result := db.Exec("DELETE FROM tour_views WHERE user_id = ? AND tour_id = ?", userID, tourID)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Не вдалося видалити запис",
			})
		}

		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Запис не знайдено",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Видалено з історії",
		})
	}
}
