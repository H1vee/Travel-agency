package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type AdminTourItem struct {
	ID          uint    `json:"id"`
	Title       string  `json:"title"`
	Price       float64 `json:"price"`
	Rating      float64 `json:"rating"`
	StatusID    uint    `json:"status_id"`
	StatusName  string  `json:"status_name"`
	TotalSeats  int     `json:"total_seats"`
	Description string  `json:"description"`
}

type TourDateInput struct {
	FromLocationID uint   `json:"from_location_id"`
	ToLocationID   uint   `json:"to_location_id"`
	DateFrom       string `json:"date_from"`
	DateTo         string `json:"date_to"`
}

type CreateTourRequest struct {
	Title               string          `json:"title"`
	Description         string          `json:"description"`
	CallToAction        string          `json:"call_to_action"`
	Price               float64         `json:"price"`
	StatusID            uint            `json:"status_id"`
	DetailedDescription string          `json:"detailed_description"`
	TotalSeats          int             `json:"total_seats"`
	CardImage           string          `json:"card_image"`
	GalleryImages       []string        `json:"gallery_images"`
	Dates               []TourDateInput `json:"dates"`
}

type UpdateTourRequest struct {
	Title               *string          `json:"title"`
	Description         *string          `json:"description"`
	CallToAction        *string          `json:"call_to_action"`
	Price               *float64         `json:"price"`
	StatusID            *uint            `json:"status_id"`
	DetailedDescription *string          `json:"detailed_description"`
	TotalSeats          *int             `json:"total_seats"`
	CardImage           *string          `json:"card_image"`
	GalleryImages       []string         `json:"gallery_images"`
	Dates               []TourDateInput  `json:"dates"`
}

func GetAdminTours(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		page, _ := strconv.Atoi(c.QueryParam("page"))
		if page <= 0 {
			page = 1
		}
		limit, _ := strconv.Atoi(c.QueryParam("limit"))
		if limit <= 0 || limit > 100 {
			limit = 20
		}
		offset := (page - 1) * limit

		var total int64
		db.Table("tours").Count(&total)

		var tours []AdminTourItem
		err := db.Table("tours").
			Select("tours.id, tours.title, tours.price, tours.rating, tours.status_id, statuses.name as status_name, tours.total_seats, tours.description").
			Joins("JOIN statuses ON tours.status_id = statuses.id").
			Order("tours.id DESC").
			Offset(offset).
			Limit(limit).
			Find(&tours).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch tours",
			})
		}

		totalPages := int((total + int64(limit) - 1) / int64(limit))

		return c.JSON(http.StatusOK, map[string]interface{}{
			"tours":       tours,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		})
	}
}

func CreateTour(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CreateTourRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request",
			})
		}

		if req.Title == "" || req.Price <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Title and price are required",
			})
		}

		if req.StatusID == 0 {
			req.StatusID = 1
		}
		if req.TotalSeats == 0 {
			req.TotalSeats = 10
		}
		if req.CallToAction == "" {
			req.CallToAction = "Забронювати"
		}

		tx := db.Begin()

		// 1. Create tour
		var tourID uint
		err := tx.Raw(`
			INSERT INTO tours (title, description, call_to_action, price, status_id, detailed_description, total_seats, rating)
			VALUES (?, ?, ?, ?, ?, ?, ?, 0.0)
			RETURNING id
		`, req.Title, req.Description, req.CallToAction, req.Price, req.StatusID, req.DetailedDescription, req.TotalSeats).
			Scan(&tourID).Error

		if err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to create tour",
			})
		}

		// 2. Create tour dates
		for _, d := range req.Dates {
			if d.FromLocationID == 0 || d.ToLocationID == 0 || d.DateFrom == "" || d.DateTo == "" {
				continue
			}

			err := tx.Exec(`
				INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
				VALUES (?, ?, ?, ?, ?)
			`, tourID, d.FromLocationID, d.ToLocationID, d.DateFrom, d.DateTo).Error

			if err != nil {
				tx.Rollback()
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": fmt.Sprintf("Failed to create tour date: %v", err),
				})
			}

			// Create tour_seats for this date
			var tourDateID uint
			tx.Raw("SELECT id FROM tour_dates WHERE tour_id = ? ORDER BY id DESC LIMIT 1", tourID).Scan(&tourDateID)

			if tourDateID > 0 {
				tx.Exec(`
					INSERT INTO tour_seats (tour_date_id, available_seats)
					VALUES (?, ?)
				`, tourDateID, req.TotalSeats)
			}
		}

		// 3. Create card image
		if req.CardImage != "" {
			tx.Exec(`INSERT INTO tour_card_images (tour_id, image_src) VALUES (?, ?)`, tourID, req.CardImage)
		}

		// 4. Create gallery images
		for _, img := range req.GalleryImages {
			if img != "" {
				tx.Exec(`INSERT INTO tour_gallery_images (tour_id, image_src) VALUES (?, ?)`, tourID, img)
			}
		}

		tx.Commit()

		return c.JSON(http.StatusCreated, map[string]interface{}{
			"message": "Tour created",
			"tour_id": tourID,
		})
	}
}

func UpdateTour(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")

		var req UpdateTourRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request",
			})
		}

		tx := db.Begin()

		// 1. Update tour fields
		updates := map[string]interface{}{}
		if req.Title != nil {
			updates["title"] = *req.Title
		}
		if req.Description != nil {
			updates["description"] = *req.Description
		}
		if req.CallToAction != nil {
			updates["call_to_action"] = *req.CallToAction
		}
		if req.Price != nil {
			updates["price"] = *req.Price
		}
		if req.StatusID != nil {
			updates["status_id"] = *req.StatusID
		}
		if req.DetailedDescription != nil {
			updates["detailed_description"] = *req.DetailedDescription
		}
		if req.TotalSeats != nil {
			updates["total_seats"] = *req.TotalSeats
		}

		if len(updates) > 0 {
			result := tx.Table("tours").Where("id = ?", tourID).Updates(updates)
			if result.Error != nil {
				tx.Rollback()
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Failed to update tour",
				})
			}
			if result.RowsAffected == 0 {
				tx.Rollback()
				return c.JSON(http.StatusNotFound, map[string]string{
					"error": "Tour not found",
				})
			}
		}

// 2. Update card image
		if req.CardImage != nil {
			tx.Exec("DELETE FROM tour_card_images WHERE tour_id = ?", tourID)
			if *req.CardImage != "" {
				tx.Exec("INSERT INTO tour_card_images (tour_id, image_src) VALUES (?, ?)", tourID, *req.CardImage)
			}
		}

		// 3. Update gallery images
		if req.GalleryImages != nil {
			tx.Exec("DELETE FROM tour_gallery_images WHERE tour_id = ?", tourID)
			for _, img := range req.GalleryImages {
				if img != "" {
					tx.Exec("INSERT INTO tour_gallery_images (tour_id, image_src) VALUES (?, ?)", tourID, img)
				}
			}
		}

		// 4. Update dates
		if req.Dates != nil {
			// Delete old seats and dates
			tx.Exec("DELETE FROM tour_seats WHERE tour_date_id IN (SELECT id FROM tour_dates WHERE tour_id = ?)", tourID)
			tx.Exec("DELETE FROM tour_dates WHERE tour_id = ?", tourID)

			totalSeats := 10
			if req.TotalSeats != nil {
				totalSeats = *req.TotalSeats
			}

			for _, d := range req.Dates {
				if d.FromLocationID == 0 || d.ToLocationID == 0 || d.DateFrom == "" || d.DateTo == "" {
					continue
				}

				tx.Exec(`
					INSERT INTO tour_dates (tour_id, from_location_id, to_location_id, date_from, date_to)
					VALUES (?, ?, ?, ?, ?)
				`, tourID, d.FromLocationID, d.ToLocationID, d.DateFrom, d.DateTo)

				var tourDateID uint
				tx.Raw("SELECT id FROM tour_dates WHERE tour_id = ? ORDER BY id DESC LIMIT 1", tourID).Scan(&tourDateID)

				if tourDateID > 0 {
					tx.Exec("INSERT INTO tour_seats (tour_date_id, available_seats) VALUES (?, ?)", tourDateID, totalSeats)
				}
			}
		}

		tx.Commit()

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Tour updated",
		})
	}
}

func DeleteTour(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")

		result := db.Table("tours").
			Where("id = ?", tourID).
			Update("status_id", 2)

		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to deactivate tour",
			})
		}
		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Tour not found",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"message": "Tour deactivated",
		})
	}
}

func GetAdminTourDetail(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")

		var tour struct {
			ID                  uint    `json:"id"`
			Title               string  `json:"title"`
			Description         string  `json:"description"`
			CallToAction        string  `json:"call_to_action"`
			Price               float64 `json:"price"`
			Rating              float64 `json:"rating"`
			StatusID            uint    `json:"status_id"`
			StatusName          string  `json:"status_name"`
			DetailedDescription string  `json:"detailed_description"`
			TotalSeats          int     `json:"total_seats"`
		}

		err := db.Table("tours").
			Select("tours.*, statuses.name as status_name").
			Joins("JOIN statuses ON tours.status_id = statuses.id").
			Where("tours.id = ?", tourID).
			First(&tour).Error

		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Tour not found",
			})
		}

		// Get dates with locations
		var dates []struct {
			ID               uint   `json:"id"`
			FromLocationID   uint   `json:"from_location_id"`
			FromLocationName string `json:"from_location_name"`
			ToLocationID     uint   `json:"to_location_id"`
			ToLocationName   string `json:"to_location_name"`
			DateFrom         string `json:"date_from"`
			DateTo           string `json:"date_to"`
		}
		db.Raw(`
			SELECT td.id, td.from_location_id, fl.name as from_location_name,
				td.to_location_id, tl.name as to_location_name,
				td.date_from, td.date_to
			FROM tour_dates td
			JOIN locations fl ON td.from_location_id = fl.id
			JOIN locations tl ON td.to_location_id = tl.id
			WHERE td.tour_id = ?
			ORDER BY td.date_from
		`, tourID).Scan(&dates)

		// Get card image
		var cardImage string
		db.Table("tour_card_images").Select("image_src").Where("tour_id = ?", tourID).Scan(&cardImage)

		// Get gallery images
		var galleryImages []string
		db.Table("tour_gallery_images").Select("image_src").Where("tour_id = ?", tourID).Scan(&galleryImages)

		// Get bookings count
		var bookingsCount int64
		db.Table("bookings").
			Joins("JOIN tour_dates ON bookings.tour_date_id = tour_dates.id").
			Where("tour_dates.tour_id = ?", tourID).
			Count(&bookingsCount)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"tour":           tour,
			"dates":          dates,
			"card_image":     cardImage,
			"gallery_images": galleryImages,
			"bookings_count": bookingsCount,
		})
	}
}

func GetLocations(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var locations []struct {
			ID      uint   `json:"id"`
			Name    string `json:"name"`
			Country string `json:"country"`
		}

		err := db.Table("locations").
			Select("id, name, country").
			Order("country, name").
			Find(&locations).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch locations",
			})
		}

		return c.JSON(http.StatusOK, locations)
	}
}