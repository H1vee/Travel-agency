package main

import (
	"log"
	"net/http"
	"tour-server/config"
	"tour-server/database"
	"tour-server/email"
	"tour-server/middleware"

	adminAPI "tour-server/admin/api"
	carAPI "tour-server/car/api"
	inquiryAPI "tour-server/inquiry/api"
	search "tour-server/search/api"
	tourusers "tour-server/tourusers/api"

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

	// ========================================
	// EMAIL SERVICE INITIALIZATION
	// ========================================
	if cfg.SMTP.User != "" && cfg.SMTP.Password != "" {
		email.Init(email.SMTPConfig{
			Host:     cfg.SMTP.Host,
			Port:     cfg.SMTP.Port,
			User:     cfg.SMTP.User,
			Password: cfg.SMTP.Password,
			From:     cfg.SMTP.From,
		})
	} else {
		log.Println("SMTP credentials not set — email notifications disabled")
	}

	// ========================================
	// RATE LIMITERS
	// ========================================
	authRL := middleware.AuthLimiter()       // auth endpoints
	inquiryRL := middleware.BookingLimiter()  // inquiry submissions

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
		XSSProtection:      "1; mode=block",
		ContentTypeNosniff: "nosniff",
		XFrameOptions:      "SAMEORIGIN",
		HSTSMaxAge:         31536000,
	}))

	e.Static("/static", "static")

	// ========================================
	// ROOT
	// ========================================
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Welcome to AutoBoss Car Catalogue API",
			"app":     cfg.App.Name,
			"version": cfg.App.Version,
			"env":     cfg.App.Environment,
			"endpoints": map[string]string{
				"cards":          "/cards - Active cars (card view)",
				"car":            "/cars/:id - Full car detail",
				"carousel":       "/cars/:id/gallery - Car gallery images",
				"search":         "/search - Catalogue search with filters",
				"filterOptions":  "/filter-options - Available filter values",
				"inquiries":      "POST /inquiries - Submit a contact request",
			},
		})
	})

	// ========================================
	// AUTHENTICATION (admin login, rate limited)
	// ========================================
	e.POST("/auth/register", tourusers.RegisterUser(database.DB), authRL)
	e.POST("/auth/login", tourusers.LoginUser(database.DB), authRL)
	e.POST("/auth/forgot-password", tourusers.ForgotPassword(database.DB), authRL)
	e.POST("/auth/reset-password", tourusers.ResetPassword(database.DB), authRL)
	e.GET("/auth/verify-reset-token", tourusers.VerifyResetToken(database.DB))

	// ========================================
	// PUBLIC CATALOGUE ENDPOINTS
	// ========================================
	e.GET("/cards", carAPI.GetCarsForCards(database.DB))
	e.GET("/carswiper", carAPI.GetCarsForSwiper(database.DB))
	e.GET("/cars/:id", carAPI.GetCarByID(database.DB))
	e.GET("/cars/:id/gallery", carAPI.GetCarCarousel(database.DB))
	e.GET("/search", search.SearchCars(database.DB))
	e.GET("/filter-options", search.GetFilterOptions(database.DB))
	e.GET("/stats", carAPI.GetPublicStats(database.DB))

	// Contact / lead submission (rate limited)
	e.POST("/inquiries", inquiryAPI.CreateInquiry(database.DB), inquiryRL)

	// ========================================
	// PROTECTED PROFILE ENDPOINTS (auth required)
	// ========================================
	protected := e.Group("")
	protected.Use(middleware.JWTMiddleware())
	protected.GET("/profile", tourusers.GetProfile(database.DB))
	protected.PUT("/profile", tourusers.UpdateProfile(database.DB))

	// ========================================
	// ADMIN ENDPOINTS (auth + admin role)
	// ========================================
	admin := e.Group("/admin")
	admin.Use(middleware.JWTMiddleware())
	admin.Use(middleware.AdminMiddleware())

	admin.GET("/analytics/overview", adminAPI.GetAnalyticsOverview(database.DB))

	admin.GET("/cars", adminAPI.GetAdminCars(database.DB))
	admin.GET("/cars/:id", adminAPI.GetAdminCarDetail(database.DB))
	admin.POST("/cars", adminAPI.CreateCar(database.DB))
	admin.PUT("/cars/:id", adminAPI.UpdateCar(database.DB))
	admin.PUT("/cars/:id/status", adminAPI.UpdateCarStatus(database.DB))
	admin.DELETE("/cars/:id", adminAPI.DeleteCar(database.DB))

	admin.GET("/statuses", adminAPI.GetStatuses(database.DB))

	admin.GET("/inquiries", adminAPI.GetAdminInquiries(database.DB))
	admin.PUT("/inquiries/:id/status", adminAPI.UpdateInquiryStatus(database.DB))

	admin.POST("/upload", adminAPI.UploadImage)

	// ========================================
	// START SERVER
	// ========================================
	serverAddr := cfg.Server.Host + ":" + cfg.Server.Port
	e.Logger.Fatal(e.Start(serverAddr))
}
