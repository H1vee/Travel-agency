package models

import "time"

type TourUser struct {
	ID           uint   `gorm:"primaryKey"`
	Email        string `gorm:"unique;not null"`
	PasswordHash string `gorm:"not null"`
	Name         string `gorm:"not null"`
	Phone        string
	AvatarURL    string
	Role         string `gorm:"default:user"`
	IsVerified   bool   `gorm:"default:false"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	LastLogin    *time.Time
}
