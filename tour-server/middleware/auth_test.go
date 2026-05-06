package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/labstack/echo/v4"
	"tour-server/config"
)

func setupTestConfig() {
	config.LoadConfig("")
}

func generateTestToken(secret string, userID uint, role string, expired bool) string {
	exp := time.Now().Add(24 * time.Hour)
	if expired {
		exp = time.Now().Add(-1 * time.Hour)
	}

	claims := JWTClaims{
		UserID: userID,
		Email:  "test@example.com",
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(secret))
	return tokenString
}

func TestJWTMiddleware_NoHeader(t *testing.T) {
	setupTestConfig()
	e := echo.New()

	mw := JWTMiddleware()(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mw(c)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestJWTMiddleware_InvalidFormat(t *testing.T) {
	setupTestConfig()
	e := echo.New()

	mw := JWTMiddleware()(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "NotBearer token123")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mw(c)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestJWTMiddleware_InvalidToken(t *testing.T) {
	setupTestConfig()
	e := echo.New()

	mw := JWTMiddleware()(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mw(c)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestJWTMiddleware_ExpiredToken(t *testing.T) {
	setupTestConfig()
	cfg := config.GetConfig()
	e := echo.New()

	token := generateTestToken(cfg.JWT.Secret, 1, "user", true)

	mw := JWTMiddleware()(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mw(c)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestJWTMiddleware_ValidToken(t *testing.T) {
	setupTestConfig()
	cfg := config.GetConfig()
	e := echo.New()

	token := generateTestToken(cfg.JWT.Secret, 42, "user", false)

	var capturedUserID uint
	mw := JWTMiddleware()(func(c echo.Context) error {
		capturedUserID = c.Get("user_id").(uint)
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mw(c)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if capturedUserID != 42 {
		t.Errorf("expected user_id=42, got %d", capturedUserID)
	}
}
