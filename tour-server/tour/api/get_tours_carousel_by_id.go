package api

import (
	"net/http"
	"tour-server/tour/dto"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func GetToursCarouselByID(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var tour []dto.TourCarousel

		return c.JSON(http.StatusOK, tour)
	}

}
