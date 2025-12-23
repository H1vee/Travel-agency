package middleware

import (
	"strings"
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"
	"github.com/labstack/echo/v4"
)


func StaticCacheMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path

			if strings.HasPrefix(path, "/static/") {

				switch {
				case strings.HasSuffix(path, ".jpg") ||
					strings.HasSuffix(path, ".jpeg") ||
					strings.HasSuffix(path, ".png") ||
					strings.HasSuffix(path, ".gif") ||
					strings.HasSuffix(path, ".webp") ||
					strings.HasSuffix(path, ".svg"):
					c.Response().Header().Set("Cache-Control", "public, max-age=31536000, immutable")

				case strings.HasSuffix(path, ".css"):
					c.Response().Header().Set("Cache-Control", "public, max-age=86400")

				case strings.HasSuffix(path, ".js"):
					c.Response().Header().Set("Cache-Control", "public, max-age=86400")

				case strings.HasSuffix(path, ".woff") ||
					strings.HasSuffix(path, ".woff2") ||
					strings.HasSuffix(path, ".ttf") ||
					strings.HasSuffix(path, ".eot"):
					c.Response().Header().Set("Cache-Control", "public, max-age=31536000, immutable")

				default:
					c.Response().Header().Set("Cache-Control", "public, max-age=3600")
				}

				c.Response().Header().Set("ETag", generateETag(path))
			}

			return next(c)
		}
	}
}


func generateETag(path string) string {
	file, err := os.Open("static" + path)
	if err != nil {
		return ""
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return ""
	}

	return `"` + hex.EncodeToString(hash.Sum(nil)) + `"`
}