package dto

import (
	"time"
)

type TourDTO struct {
	ID                  uint      `json:"id"`
	Title               string    `json:"title"`
	Description         string    `json:"description"`
	CallToAction        string    `json:"callToAction"`
	Price               float64   `json:"price"`
	Rating              float64   `json:"rating"`
	StatusID            uint      `json:"statusId"`
	Status              string    `json:"status"`
	DateFrom            time.Time `json:"datefrom"`
	DateTo              time.Time `json:"dateto"`
	Duration            uint      `json:"duration"`
	DetailedDescription string    `json:"detailedDescription"`
}
