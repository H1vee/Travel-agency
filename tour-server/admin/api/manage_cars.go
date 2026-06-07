package api

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type AdminCarItem struct {
	ID         uint    `json:"id"`
	Make       string  `json:"make"`
	Model      string  `json:"model"`
	Year       int     `json:"year"`
	Price      float64 `json:"price"`
	Mileage    int     `json:"mileage"`
	StatusID   uint    `json:"status_id"`
	StatusName string  `json:"status_name"`
}

// carFields holds the editable attributes of a car shared by create/update.
type carFields struct {
	Make            string   `json:"make"`
	Model           string   `json:"model"`
	Year            int      `json:"year"`
	VIN             string   `json:"vin"`
	Price           float64  `json:"price"`
	Mileage         int      `json:"mileage"`
	FuelType        string   `json:"fuel_type"`
	Engine          string   `json:"engine"`
	EngineCapacity  *float64 `json:"engine_capacity"`
	BatteryCapacity *float64 `json:"battery_capacity"`
	Transmission    string   `json:"transmission"`
	Drive           string   `json:"drive"`
	BodyType        string   `json:"body_type"`
	Color           string   `json:"color"`
	Seats           int      `json:"seats"`
	Description     string   `json:"description"`
	StatusID        uint     `json:"status_id"`
}

type CreateCarRequest struct {
	carFields
	CardImage     string   `json:"card_image"`
	GalleryImages []string `json:"gallery_images"`
}

type UpdateCarRequest struct {
	carFields
	CardImage     *string  `json:"card_image"`
	GalleryImages []string `json:"gallery_images"`
}

func GetAdminCars(db *gorm.DB) echo.HandlerFunc {
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
		db.Table("cars").Count(&total)

		var cars []AdminCarItem
		err := db.Table("cars").
			Select("cars.id, cars.make, cars.model, cars.year, cars.price, cars.mileage, cars.status_id, statuses.name as status_name").
			Joins("JOIN statuses ON cars.status_id = statuses.id").
			Order("cars.id DESC").
			Offset(offset).
			Limit(limit).
			Find(&cars).Error

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch cars"})
		}

		totalPages := int((total + int64(limit) - 1) / int64(limit))
		return c.JSON(http.StatusOK, map[string]interface{}{
			"cars":        cars,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		})
	}
}

func CreateCar(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req CreateCarRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		if req.Make == "" || req.Model == "" || req.Year == 0 || req.Price <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Make, model, year and price are required",
			})
		}
		if req.StatusID == 0 {
			req.StatusID = activeStatusID(db)
		}

		tx := db.Begin()

		var carID uint
		err := tx.Raw(`
			INSERT INTO cars
				(make, model, year, vin, price, mileage, fuel_type, engine,
				 engine_capacity, battery_capacity, transmission, drive,
				 body_type, color, seats, description, status_id)
			VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
			RETURNING id
		`, req.Make, req.Model, req.Year, req.VIN, req.Price, req.Mileage,
			req.FuelType, req.Engine, req.EngineCapacity, req.BatteryCapacity,
			req.Transmission, req.Drive, req.BodyType, req.Color, req.Seats,
			req.Description, req.StatusID).Scan(&carID).Error

		if err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create car"})
		}

		if req.CardImage != "" {
			tx.Exec(`INSERT INTO car_card_images (car_id, image_src) VALUES (?, ?)`, carID, req.CardImage)
		}
		for i, img := range req.GalleryImages {
			if img != "" {
				tx.Exec(`INSERT INTO car_gallery_images (car_id, image_src, position) VALUES (?, ?, ?)`, carID, img, i)
			}
		}

		tx.Commit()
		return c.JSON(http.StatusCreated, map[string]interface{}{
			"message": "Car created",
			"car_id":  carID,
		})
	}
}

func UpdateCar(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		carID := c.Param("id")

		var req UpdateCarRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		tx := db.Begin()

		updates := map[string]interface{}{
			"make":             req.Make,
			"model":            req.Model,
			"year":             req.Year,
			"vin":              req.VIN,
			"price":            req.Price,
			"mileage":          req.Mileage,
			"fuel_type":        req.FuelType,
			"engine":           req.Engine,
			"engine_capacity":  req.EngineCapacity,
			"battery_capacity": req.BatteryCapacity,
			"transmission":     req.Transmission,
			"drive":            req.Drive,
			"body_type":        req.BodyType,
			"color":            req.Color,
			"seats":            req.Seats,
			"description":      req.Description,
			"updated_at":       gorm.Expr("NOW()"),
		}
		if req.StatusID != 0 {
			updates["status_id"] = req.StatusID
		}

		result := tx.Table("cars").Where("id = ?", carID).Updates(updates)
		if result.Error != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update car"})
		}
		if result.RowsAffected == 0 {
			tx.Rollback()
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Car not found"})
		}

		if req.CardImage != nil {
			tx.Exec("DELETE FROM car_card_images WHERE car_id = ?", carID)
			if *req.CardImage != "" {
				tx.Exec("INSERT INTO car_card_images (car_id, image_src) VALUES (?, ?)", carID, *req.CardImage)
			}
		}
		if req.GalleryImages != nil {
			tx.Exec("DELETE FROM car_gallery_images WHERE car_id = ?", carID)
			for i, img := range req.GalleryImages {
				if img != "" {
					tx.Exec("INSERT INTO car_gallery_images (car_id, image_src, position) VALUES (?, ?, ?)", carID, img, i)
				}
			}
		}

		tx.Commit()
		return c.JSON(http.StatusOK, map[string]string{"message": "Car updated"})
	}
}

// UpdateCarStatus toggles a car's visibility by changing its status.
func UpdateCarStatus(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		carID := c.Param("id")

		var body struct {
			StatusID uint `json:"status_id"`
		}
		if err := c.Bind(&body); err != nil || body.StatusID == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "status_id is required"})
		}

		result := db.Table("cars").Where("id = ?", carID).
			Updates(map[string]interface{}{"status_id": body.StatusID, "updated_at": gorm.Expr("NOW()")})
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update status"})
		}
		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Car not found"})
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "Status updated"})
	}
}

// DeleteCar permanently removes a car and its images.
func DeleteCar(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		carID := c.Param("id")

		result := db.Exec("DELETE FROM cars WHERE id = ?", carID)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete car"})
		}
		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Car not found"})
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "Car deleted"})
	}
}

func GetAdminCarDetail(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		carID := c.Param("id")

		var car map[string]interface{}
		err := db.Table("cars").
			Select("cars.*, statuses.name as status_name").
			Joins("JOIN statuses ON cars.status_id = statuses.id").
			Where("cars.id = ?", carID).
			Take(&car).Error
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Car not found"})
		}

		var cardImage string
		db.Table("car_card_images").Select("image_src").Where("car_id = ?", carID).Scan(&cardImage)

		var galleryImages []string
		db.Table("car_gallery_images").Select("image_src").Where("car_id = ?", carID).Order("position ASC, id ASC").Scan(&galleryImages)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"car":            car,
			"card_image":     cardImage,
			"gallery_images": galleryImages,
		})
	}
}

// GetStatuses returns the list of statuses for admin dropdowns.
func GetStatuses(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var statuses []struct {
			ID   uint   `json:"id"`
			Name string `json:"name"`
		}
		db.Table("statuses").Select("id, name").Order("id ASC").Find(&statuses)
		return c.JSON(http.StatusOK, statuses)
	}
}

func activeStatusID(db *gorm.DB) uint {
	var id uint
	db.Table("statuses").Select("id").Where("name = ?", "active").Scan(&id)
	if id == 0 {
		id = 1
	}
	return id
}
