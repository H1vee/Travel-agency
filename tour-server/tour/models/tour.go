package models

import (
	"time"
)

type Tour struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	Title               string    `json:"title" gorm:"not null"`
	Description         string    `json:"description"`
	DetailedDescription string    `json:"detailedDescription"`
	From                string    `json:"from" gorm:"not null"`
	To                  string    `json:"to" gorm:"not null"`
	DateFrom            time.Time `json:"dateFrom" gorm:"not null"`
	DateTo              time.Time `json:"dateTo" gorm:"not null"`
	Price               float64   `json:"price" gorm:"not null"`
	ImageSrc            string    `json:"imageSrc"`
}
