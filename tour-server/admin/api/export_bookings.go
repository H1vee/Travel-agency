package api

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type ExportBookingRow struct {
	ID            uint    `json:"id"`
	TourTitle     string  `json:"tour_title"`
	CustomerName  string  `json:"customer_name"`
	CustomerEmail string  `json:"customer_email"`
	CustomerPhone string  `json:"customer_phone"`
	Seats         int     `json:"seats"`
	TotalPrice    float64 `json:"total_price"`
	Status        string  `json:"status"`
	BookedAt      string  `json:"booked_at"`
}

func ExportBookingsCSV(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		statusFilter := c.QueryParam("status")

		var rows []ExportBookingRow
		query := db.Table("bookings").
			Select(`bookings.id,
				tours.title as tour_title,
				bookings.customer_name,
				bookings.customer_email,
				bookings.customer_phone,
				bookings.seats,
				bookings.total_price,
				bookings.status,
				bookings.booked_at`).
			Joins("JOIN tour_dates ON bookings.tour_date_id = tour_dates.id").
			Joins("JOIN tours ON tour_dates.tour_id = tours.id").
			Order("bookings.booked_at DESC")

		if statusFilter != "" {
			query = query.Where("bookings.status = ?", statusFilter)
		}

		if err := query.Find(&rows).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to export bookings",
			})
		}

		var csv strings.Builder
		csv.WriteString("ID,Tour,Customer Name,Email,Phone,Seats,Total Price,Status,Booked At\n")

		for _, row := range rows {
			line := fmt.Sprintf("%d,\"%s\",\"%s\",\"%s\",\"%s\",%d,%.2f,%s,%s\n",
				row.ID,
				strings.ReplaceAll(row.TourTitle, "\"", "\"\""),
				strings.ReplaceAll(row.CustomerName, "\"", "\"\""),
				row.CustomerEmail,
				row.CustomerPhone,
				row.Seats,
				row.TotalPrice,
				row.Status,
				row.BookedAt,
			)
			csv.WriteString(line)
		}

		filename := fmt.Sprintf("bookings_%s.csv", time.Now().Format("2006-01-02"))

		c.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

		return c.String(http.StatusOK, csv.String())
	}
}