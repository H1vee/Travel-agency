package main

import (
	"log"
	"net/http"
	"tour-server/config"
	"tour-server/database"
	"tour-server/middleware"

	bookings "tour-server/bookings/api"
	search "tour-server/search/api"
	"tour-server/tour/api"
	tourcard "tour-server/tourcardimage/api"
	tourreviews "tour-server/tourreviews/api"
	tourseats "tour-server/tourseats/api"
	tourusers "tour-server/tourusers/api"
	userfavorites "tour-server/userfavorites/api"
	tourcomments "tour-server/tourcomments/api"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
)

type CustomValidator struct {
	validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return err
	}
	return nil
}

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

	e.Validator = &CustomValidator{validator: validator.New()}

	e.Static("/static", "static")

	// CORS middleware - це має бути перед усіма роутами
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:3000", 
			"http://127.0.0.1:3000",
			"http://localhost:3006", 
			"http://127.0.0.1:3006",
			"http://localhost:3001", 
			"http://127.0.0.1:3001",
		},
		AllowMethods: []string{
			http.MethodGet, 
			http.MethodHead, 
			http.MethodPut, 
			http.MethodPatch, 
			http.MethodPost, 
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
		},
		ExposeHeaders: []string{
			"X-Total-Count", 
			"X-Total-Pages", 
			"X-Current-Page", 
			"X-Per-Page",
		},
		AllowCredentials: true,
	}))

	if cfg.App.Debug {
		e.Use(echomiddleware.Logger())
	}

	// Root endpoint
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Welcome to Tour Server API",
			"app":     cfg.App.Name,
			"version": cfg.App.Version,
			"env":     cfg.App.Environment,
			"endpoints": map[string]string{
				"search": "/search - Enhanced search with filters and pagination",
				"cards":  "/cards - Get all tour cards",
				"tours":  "/tours - Get all tours with details",
			},
		})
	})

	// Authentication endpoints
	e.POST("/auth/register", tourusers.RegisterUser(database.DB))
	e.POST("/auth/login", tourusers.LoginUser(database.DB))

	// Public tour endpoints
	e.GET("/cards", api.GetToursForCards(database.DB))
	e.GET("/tours", api.GetTours(database.DB))
	e.GET("/tours/:id", api.GetTourById(database.DB))
	e.GET("/tourimage", tourcard.GetTourCardImages(database.DB))
	e.GET("/tourswiper", api.GetToursForSwiper(database.DB))
	e.GET("/tour-seats/:id", tourseats.GetTourSeatsByTourID(database.DB))
	e.GET("/tour-carousel/:id", api.GetToursCarouselByID(database.DB))
	e.GET("/tours-search-by-ids", api.GetToursForCardsByID(database.DB))

	// Enhanced search endpoint
	e.GET("/search", search.SearchTours(database.DB))

	// Reviews
	e.GET("/tour-reviews/:id", tourreviews.GetReviewsByTourID(database.DB))

	// Optional authentication for bookings and comments
	bookingRoute := e.Group("")
	bookingRoute.Use(middleware.OptionalJWTMiddleware())
	bookingRoute.POST("/tour/bookings", bookings.PostBookings(database.DB))

	commentRoute := e.Group("")
	commentRoute.Use(middleware.OptionalJWTMiddleware())
	commentRoute.GET("/tour-comments/:id", tourcomments.GetTourComments(database.DB))

	// Protected endpoints (authentication required)
	protected := e.Group("")
	protected.Use(middleware.JWTMiddleware())

	// User profile
	protected.GET("/profile", tourusers.GetProfile(database.DB))
	protected.PUT("/profile", tourusers.UpdateProfile(database.DB))

	// User bookings
	protected.GET("/user-bookings", bookings.GetUserBookings(database.DB))

	// User reviews
	protected.POST("/tour-reviews", tourreviews.CreateTourReview(database.DB))

	// User favorites
	protected.POST("/user-favorites", userfavorites.AddFavorite(database.DB))
	protected.GET("/user-favorites", userfavorites.GetUserFavorites(database.DB))
	protected.DELETE("/user-favorites/:tour_id", userfavorites.RemoveFavorite(database.DB))

	// Comments
	protected.POST("/tour-comments", tourcomments.CreateComment(database.DB))
	protected.PUT("/tour-comments/:id", tourcomments.UpdateComment(database.DB))
	protected.DELETE("/tour-comments/:id", tourcomments.DeleteComment(database.DB))
	
	serverAddr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Starting %s v%s", cfg.App.Name, cfg.App.Version)
	log.Printf("Environment: %s", cfg.App.Environment)
	log.Printf("Server running on: http://%s", serverAddr)
	log.Printf("CORS enabled for: localhost:3000, localhost:3006, localhost:3001")
	log.Printf("Enhanced search endpoint: GET /search")
	log.Printf("Search supports: title, minPrice, maxPrice, minRating, maxRating, minDuration, maxDuration, region, page, limit, sortBy")

	e.Logger.Fatal(e.Start(serverAddr))
}