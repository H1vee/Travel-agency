// get_tours_carousel_by_id.go - FIXED VERSION

package api

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type CarouselImage struct {
	TourID   int    `json:"tourID" gorm:"column:tour_id"`
	ImageSrc string `json:"image_src" gorm:"column:image_src"`
}

func GetToursCarouselByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")
		log.Printf("🔍 Fetching carousel for tour ID: %s", tourID)

		var images []CarouselImage

		result := db.Table("tour_gallery_images").
			Select("tour_id as tourID, image_src").
			Where("tour_id = ?", tourID).
			Find(&images)

		if result.Error != nil {
			log.Printf("❌ Database error: %v", result.Error)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to fetch carousel images",
			})
		}

		log.Printf("✅ Found %d carousel images for tour ID %s", len(images), tourID)
		
		for i, img := range images {
			log.Printf("   Image %d: TourID=%d, ImageSrc=%s", i+1, img.TourID, img.ImageSrc)
		}

		if len(images) == 0 {
			log.Printf("⚠️ No images found for tour %s", tourID)
			return c.JSON(http.StatusOK, []CarouselImage{})
		}

		return c.JSON(http.StatusOK, images)
	}
}

/* 
АЛЬТЕРНАТИВНИЙ ВАРІАНТ (якщо перший не працює):

func GetToursCarouselByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		tourID := c.Param("id")
		
		var images []CarouselImage
		
		// Використовуємо Raw SQL для точності
		err := db.Raw(`
			SELECT tour_id, image_src 
			FROM tour_gallery_images 
			WHERE tour_id = ?
		`, tourID).Scan(&images).Error
		
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": err.Error(),
			})
		}
		
		return c.JSON(http.StatusOK, images)
	}
}
*/