package models

type TourGalleryImage struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	TourID   uint   `json:"tourId" gorm:"not null"`
	ImageSrc string `json:"imageSrc" gorm:"not null"`
}
