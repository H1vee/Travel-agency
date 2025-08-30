package dto

import "time"

type BookingResponse struct {
	ID            uint      `json:"id"`
	TourTitle     string    `json:"tour_title"`
	FromLocation  string    `json:"from_location,omitempty"`
	ToLocation    string    `json:"to_location,omitempty"`
	DateFrom      time.Time `json:"date_from"`
	DateTo        time.Time `json:"date_to"`
	CustomerName  string    `json:"customer_name"`
	CustomerEmail string    `json:"customer_email,omitempty"`
	CustomerPhone string    `json:"customer_phone"`
	Seats         int       `json:"seats"`
	TotalPrice    float64   `json:"total_price"`
	Status        string    `json:"status"`
	BookedAt      time.Time `json:"booked_at"`
}
