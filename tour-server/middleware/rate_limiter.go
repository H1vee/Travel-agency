package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

type visitor struct {
	tokens    float64
	lastSeen  time.Time
	maxTokens float64
	rate      float64 // tokens per second
}

type RateLimiter struct {
	visitors map[string]*visitor
	mu       sync.Mutex
	rate     float64
	burst    int
	cleanup  time.Duration
}

// NewRateLimiter creates a limiter.
//   - rate: requests per second allowed
//   - burst: max burst size (bucket capacity)
func NewRateLimiter(rate float64, burst int) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate,
		burst:    burst,
		cleanup:  5 * time.Minute,
	}

	// Background cleanup of stale entries
	go func() {
		for {
			time.Sleep(rl.cleanup)
			rl.mu.Lock()
			for ip, v := range rl.visitors {
				if time.Since(v.lastSeen) > rl.cleanup {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func (rl *RateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	now := time.Now()

	if !exists {
		rl.visitors[ip] = &visitor{
			tokens:    float64(rl.burst) - 1,
			lastSeen:  now,
			maxTokens: float64(rl.burst),
			rate:      rl.rate,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(v.lastSeen).Seconds()
	v.tokens += elapsed * v.rate
	if v.tokens > v.maxTokens {
		v.tokens = v.maxTokens
	}
	v.lastSeen = now

	if v.tokens >= 1 {
		v.tokens--
		return true
	}

	return false
}

// Middleware returns an Echo middleware that rate-limits by client IP.
func (rl *RateLimiter) Middleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ip := c.RealIP()
			if !rl.allow(ip) {
				return c.JSON(http.StatusTooManyRequests, map[string]string{
					"error": "Забагато запитів. Спробуйте через кілька секунд.",
				})
			}
			return next(c)
		}
	}
}

// Pre-configured limiters for different endpoint groups

// AuthLimiter — strict: 5 requests per 60s (login/register brute-force protection)
func AuthLimiter() echo.MiddlewareFunc {
	return NewRateLimiter(5.0/60.0, 5).Middleware()
}

// BookingLimiter — moderate: 10 requests per 60s (spam booking protection)
func BookingLimiter() echo.MiddlewareFunc {
	return NewRateLimiter(10.0/60.0, 10).Middleware()
}

// PaymentLimiter — strict: 5 requests per 60s
func PaymentLimiter() echo.MiddlewareFunc {
	return NewRateLimiter(5.0/60.0, 5).Middleware()
}

// CommentLimiter — moderate: 15 requests per 60s
func CommentLimiter() echo.MiddlewareFunc {
	return NewRateLimiter(15.0/60.0, 15).Middleware()
}

// APILimiter — general: 60 requests per 60s
func APILimiter() echo.MiddlewareFunc {
	return NewRateLimiter(1.0, 60).Middleware()
}