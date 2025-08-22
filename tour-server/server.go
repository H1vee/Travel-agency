package main

import (
	"log"
	"net/http"
	bookings "tour-server/bookings/api"
	"tour-server/config"
	"tour-server/database"
	"tour-server/middleware"
	search "tour-server/search/api"
	"tour-server/tour/api"
	tourcard "tour-server/tourcardimage/api"
	tourreviews "tour-server/tourreviews/api"
	tourseats "tour-server/tourseats/api"
	tourusers "tour-server/tourusers/api"
	userfavorites "tour-server/userfavorites/api"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
)

func main() {
	if err := config.LoadConfig("config/config.yaml"); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	database.InitDB()
	if database.DB == nil {
		log.Fatal("Database connection is nil")
	}

	cfg := config.GetConfig()

	e := echo.New()
	e.Static("/static", "static")

	e.Use(echomiddleware.CORS())

	if cfg.App.Debug {
		e.Use(echomiddleware.Logger())
	}

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Welcome to Tour Server API",
			"app":     cfg.App.Name,
			"version": cfg.App.Version,
			"env":     cfg.App.Environment,
		})
	})

	e.POST("/auth/register", tourusers.RegisterUser(database.DB))
	e.POST("/auth/login", tourusers.LoginUser(database.DB))

	e.GET("/cards", api.GetToursForCards(database.DB))
	e.GET("/tours", api.GetTours(database.DB))
	e.GET("/tourimage", tourcard.GetTourCardImages(database.DB))
	e.GET("/tourswiper", api.GetToursForSwiper(database.DB))
	e.GET("/tours/:id", api.GetTourById(database.DB))
	e.GET("/tour-seats/:id", tourseats.GetTourSeatsByTourID(database.DB))
	e.GET("/search", search.SearchTours(database.DB))
	e.GET("/tours-search-by-ids", api.GetToursForCardsByID(database.DB))
	e.GET("/tour-carousel/:id", api.GetToursCarouselByID(database.DB))

	e.GET("/tour-reviews/:id", tourreviews.GetReviewsByTourID(database.DB))

	protected := e.Group("")
	protected.Use(middleware.JWTMiddleware())

	protected.GET("/profile", tourusers.GetProfile(database.DB))

	protected.POST("/tour/bookings", bookings.PostBookings(database.DB))

	protected.POST("/tour-reviews", tourreviews.CreateTourReview(database.DB))

	protected.POST("/user-favorites", userfavorites.AddFavorite(database.DB))
	protected.GET("/user-favorites", userfavorites.GetUserFavorites(database.DB))
	protected.DELETE("/user-favorites/:tour_id", userfavorites.RemoveFavorite(database.DB))

	serverAddr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Starting %s v%s", cfg.App.Name, cfg.App.Version)
	log.Printf("Environment: %s", cfg.App.Environment)
	log.Printf("Server running on: http://%s", serverAddr)

	e.Logger.Fatal(e.Start(serverAddr))
}
