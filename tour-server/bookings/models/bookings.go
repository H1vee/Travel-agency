package models

import "time"

type Bookings struct {
	ID            uint      `json:"id"`
	TourDateID    uint      `json:"tour_date_id"`
	CustomerName  string    `json:"customer_name"`
	CustomerEmail string    `json:"customer_email"`
	CustomerPhone string    `json:"customer_phone"`
	Seats         uint      `json:"seats"`
	TotalPrice    float64   `json:"total_price"`
	Status        string    `json:"status"`
	BookedAt      time.Time `json:"booked_at"`
}
