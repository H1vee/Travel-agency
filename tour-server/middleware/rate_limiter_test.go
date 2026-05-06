package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestRateLimiterAllowsBurst(t *testing.T) {
	rl := NewRateLimiter(1.0, 5)

	for i := 0; i < 5; i++ {
		if !rl.allow("192.168.1.1") {
			t.Errorf("request %d should be allowed within burst", i+1)
		}
	}
}

func TestRateLimiterBlocksAfterBurst(t *testing.T) {
	rl := NewRateLimiter(1.0, 3)

	for i := 0; i < 3; i++ {
		rl.allow("10.0.0.1")
	}

	if rl.allow("10.0.0.1") {
		t.Error("request after burst should be blocked")
	}
}

func TestRateLimiterIsolatesIPs(t *testing.T) {
	rl := NewRateLimiter(1.0, 2)

	rl.allow("10.0.0.1")
	rl.allow("10.0.0.1")

	if rl.allow("10.0.0.1") {
		t.Error("IP 10.0.0.1 should be blocked")
	}

	if !rl.allow("10.0.0.2") {
		t.Error("IP 10.0.0.2 should be allowed")
	}
}

func TestRateLimiterMiddlewareReturns429(t *testing.T) {
	rl := NewRateLimiter(1.0, 1)

	e := echo.New()
	handler := rl.Middleware()(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Real-Ip", "10.0.0.1")

	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	handler(c)

	rec2 := httptest.NewRecorder()
	c2 := e.NewContext(req, rec2)
	handler(c2)

	if rec2.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", rec2.Code)
	}
}
