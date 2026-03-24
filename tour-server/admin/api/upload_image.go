package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

func UploadImage(c echo.Context) error {
	imageType := c.QueryParam("type")
	if imageType != "card" && imageType != "gallery" {
		imageType = "card"
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "No image file provided",
		})
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid file type. Allowed: jpg, jpeg, png, webp",
		})
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "File too large. Max 5MB",
		})
	}

	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to read file",
		})
	}
	defer src.Close()

	// Generate unique filename
	timestamp := time.Now().UnixMilli()
	cleanName := strings.ReplaceAll(strings.TrimSuffix(file.Filename, ext), " ", "_")
	filename := fmt.Sprintf("%s_%d%s", cleanName, timestamp, ext)

	// Determine save path
	var saveDir string
	var urlPath string
	if imageType == "gallery" {
		saveDir = "static/carousel"
		urlPath = fmt.Sprintf("/static/carousel/%s", filename)
	} else {
		saveDir = "static"
		urlPath = fmt.Sprintf("/static/%s", filename)
	}

	// Ensure directory exists
	os.MkdirAll(saveDir, os.ModePerm)

	// Save file
	dstPath := filepath.Join(saveDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to save file",
		})
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to write file",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"url":      urlPath,
		"filename": filename,
	})
}