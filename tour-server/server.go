package main

import (
	"log"
	"net/http"
	bookings "tour-server/bookings/api"
	"tour-server/database"
	search "tour-server/search/api"
	"tour-server/tour/api"
	tourcard "tour-server/tourcardimage/api"
	tourseats "tour-server/tourseats/api"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {

	database.InitDB()
	if database.DB == nil {
		log.Fatal("Database connection is nil")
	}

	e := echo.New()
	e.Static("/static", "static")

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})

	e.GET("/cards", api.GetToursForCards(database.DB))

	e.GET("/tours", api.GetTours(database.DB))

	e.GET("/tourimage", tourcard.GetTourCardImages(database.DB))

	e.GET("/tourswiper", api.GetToursForSwiper(database.DB))

	e.GET("/tours/:id", api.GetTourById(database.DB))

	e.GET("/tour-seats/:id", tourseats.GetTourSeatsByTourID(database.DB))

	e.POST("/tour/bookings", bookings.PostBookings(database.DB))

	e.GET("/search", search.SearchTours(database.DB))

	e.GET("tours-search-by-ids", api.GetToursForCardsByID(database.DB))

	e.GET("/tour-carousel/:id", api.GetToursCarouselByID(database.DB))

	e.Use(middleware.CORS())

	e.Logger.Fatal(e.Start("127.0.0.1:1323"))

}
