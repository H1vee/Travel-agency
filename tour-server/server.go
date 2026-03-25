package main

import (
	"log"
	"net/http"
	"tour-server/config"
	"tour-server/database"
	"tour-server/middleware"

	adminAPI "tour-server/admin/api"
	bookings "tour-server/bookings/api"
	search "tour-server/search/api"
	"tour-server/tour/api"
	tourcard "tour-server/tourcardimage/api"
	tourreviews "tour-server/tourreviews/api"
	tourseats "tour-server/tourseats/api"
	tourusers "tour-server/tourusers/api"
	userfavorites "tour-server/userfavorites/api"
	tourcomments "tour-server/tourcomments/api"
	liqpayAPI "tour-server/liqpay/api"

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

	// ========================================
	// MIDDLEWARE CONFIGURATION
	// ========================================

	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:3006",
			"http://127.0.0.1:3006",
			"http://localhost:3001",
			"http://127.0.0.1:3001",
			"http://localhost:5173",
			"http://127.0.0.1:5173",
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
			"X-Guest-Token",
		},
		ExposeHeaders: []string{
			"X-Total-Count",
			"X-Total-Pages",
			"X-Current-Page",
			"X-Per-Page",
			"Content-Type",
			"Cache-Control",
			"ETag",
		},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	e.Use(middleware.StaticCacheMiddleware())

	e.Use(echomiddleware.GzipWithConfig(echomiddleware.GzipConfig{
		Level: 5,
	}))

	if cfg.App.Debug {
		e.Use(echomiddleware.Logger())
	}

	e.Use(echomiddleware.Recover())

	e.Use(echomiddleware.SecureWithConfig(echomiddleware.SecureConfig{
		XSSProtection:         "1; mode=block",
		ContentTypeNosniff:    "nosniff",
		XFrameOptions:         "SAMEORIGIN",
		HSTSMaxAge:            31536000,
		ContentSecurityPolicy: "default-src 'self'",
	}))

	e.Static("/static", "static")

	// ========================================
	// ROOT
	// ========================================
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Welcome to Tour Server API",
			"app":     cfg.App.Name,
			"version": cfg.App.Version,
			"env":     cfg.App.Environment,
			"endpoints": map[string]string{
				"search":   "/search - Enhanced search with filters and pagination",
				"cards":    "/cards - Get all tour cards",
				"tours":    "/tours - Get all tours with details",
				"carousel": "/tour-carousel/:id - Get tour gallery images",
			},
		})
	})

	// ========================================
	// AUTHENTICATION
	// ========================================
	e.POST("/auth/register", tourusers.RegisterUser(database.DB))
	e.POST("/auth/login", tourusers.LoginUser(database.DB))

	// ========================================
	// PUBLIC ENDPOINTS
	// ========================================
	e.GET("/cards", api.GetToursForCards(database.DB))
	e.GET("/tours", api.GetTours(database.DB))
	e.GET("/tours/:id", api.GetTourById(database.DB))
	e.GET("/tourimage", tourcard.GetTourCardImages(database.DB))
	e.GET("/tourswiper", api.GetToursForSwiper(database.DB))
	e.GET("/tour-seats/:id", tourseats.GetTourSeatsByTourID(database.DB))
	e.GET("/tour-carousel/:id", api.GetToursCarouselByID(database.DB))
	e.GET("/tours-search-by-ids", api.GetToursForCardsByID(database.DB))
	e.GET("/search", search.SearchTours(database.DB))
	e.GET("/tour-reviews/:id", tourreviews.GetReviewsByTourID(database.DB))

	// ========================================
	// OPTIONAL AUTH (guests + authorized users)
	// ========================================
	optionalAuth := e.Group("")
	optionalAuth.Use(middleware.OptionalJWTMiddleware())

	optionalAuth.POST("/tour/bookings", bookings.PostBookings(database.DB))

	optionalAuth.GET("/tour-comments/:id", tourcomments.GetTourComments(database.DB))
	optionalAuth.POST("/tour-comments", tourcomments.CreateComment(database.DB))
	optionalAuth.POST("/tour-comments/:id/like", tourcomments.ToggleLike(database.DB))

	// ========================================
	// LIQPAY
	// ========================================
	// Callback is public — LiqPay server calls it directly (no auth)
	e.POST("/liqpay/callback", liqpayAPI.LiqPayCallback(database.DB))
	// Create payment requires the booking to exist — optional auth (guests too)
	optionalAuth.POST("/liqpay/create-payment", liqpayAPI.CreatePayment(database.DB))

	// ========================================
	// PROTECTED ENDPOINTS (auth required)
	// ========================================
	protected := e.Group("")
	protected.Use(middleware.JWTMiddleware())

	protected.GET("/profile", tourusers.GetProfile(database.DB))
	protected.PUT("/profile", tourusers.UpdateProfile(database.DB))
	protected.GET("/user-bookings", bookings.GetUserBookings(database.DB))
	protected.POST("/tour-reviews", tourreviews.CreateTourReview(database.DB))
	protected.PUT("/bookings/:id/cancel", bookings.CancelBooking(database.DB))
	protected.POST("/user-favorites", userfavorites.AddFavorite(database.DB))
	protected.GET("/user-favorites", userfavorites.GetUserFavorites(database.DB))
	protected.DELETE("/user-favorites/:tour_id", userfavorites.RemoveFavorite(database.DB))
	protected.PUT("/tour-comments/:id", tourcomments.UpdateComment(database.DB))
	protected.DELETE("/tour-comments/:id", tourcomments.DeleteComment(database.DB))

	// ========================================
	// ADMIN ENDPOINTS (auth + admin role)
	// ========================================
	admin := e.Group("/admin")
	admin.Use(middleware.JWTMiddleware())
	admin.Use(middleware.AdminMiddleware())

	// Analytics
	admin.GET("/analytics/overview", adminAPI.GetAnalyticsOverview(database.DB))
	admin.GET("/analytics/bookings-by-month", adminAPI.GetBookingsByMonth(database.DB))
	admin.GET("/analytics/revenue-by-month", adminAPI.GetRevenueByMonth(database.DB))
	admin.GET("/analytics/popular-tours", adminAPI.GetPopularTours(database.DB))

	// Bookings management
	admin.GET("/bookings", adminAPI.GetAdminBookings(database.DB))
	admin.PUT("/bookings/:id/status", adminAPI.UpdateBookingStatus(database.DB))
	admin.GET("/bookings/export", adminAPI.ExportBookingsCSV(database.DB))

	// Users management
	admin.GET("/users", adminAPI.GetAdminUsers(database.DB))
	admin.GET("/users/:id", adminAPI.GetAdminUserDetail(database.DB))

	// Tours management
	admin.GET("/tours", adminAPI.GetAdminTours(database.DB))
	admin.GET("/tours/:id", adminAPI.GetAdminTourDetail(database.DB))
	admin.POST("/tours", adminAPI.CreateTour(database.DB))
	admin.PUT("/tours/:id", adminAPI.UpdateTour(database.DB))
	admin.DELETE("/tours/:id", adminAPI.DeleteTour(database.DB))

	admin.GET("/locations", adminAPI.GetLocations(database.DB))
	admin.POST("/upload", adminAPI.UploadImage)

	// ========================================
	// START SERVER
	// ========================================
	serverAddr := cfg.Server.Host + ":" + cfg.Server.Port
	e.Logger.Fatal(e.Start(serverAddr))
}