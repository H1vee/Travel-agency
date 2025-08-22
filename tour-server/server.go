package main

import (
	"log"
	"net/http"
	bookings "tour-server/bookings/api"
	"tour-server/database"
	search "tour-server/search/api"
	"tour-server/tour/api"
	tourcard "tour-server/tourcardimage/api"
	tourreviews "tour-server/tourreviews/api"
	tourseats "tour-server/tourseats/api"
	userfavorites "tour-server/userfavorites/api"

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

	e.POST("/tour-reviews", tourreviews.CreateTourReview(database.DB))
	e.GET("/tour-reviews/:id", tourreviews.GetReviewsByTourID(database.DB))

	e.POST("/user-favorites", userfavorites.AddFavorite(database.DB))
	e.GET("/user-favorites", userfavorites.GetUserFavorites(database.DB))
	e.DELETE("/user-favorites/:tour_id", userfavorites.RemoveFavorite(database.DB))

	e.Use(middleware.CORS())

	e.Logger.Fatal(e.Start("127.0.0.1:1323"))
}
