package models

type Location struct {
	ID      uint   `json:"id" gorm:"primaryKey"`
	Name    string `json:"name" gorm:"not null;unique"`
	Country string `json:"country" gorm:"not null"`
}
