package models

import "time"

// Car is the core catalogue entity of the dealership.
type Car struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	Make            string    `json:"make" gorm:"not null"`
	Model           string    `json:"model" gorm:"not null"`
	Year            int       `json:"year" gorm:"not null"`
	VIN             string    `json:"vin"`
	Price           float64   `json:"price" gorm:"not null"`
	Mileage         int       `json:"mileage"`
	FuelType        string    `json:"fuelType"`
	Engine          string    `json:"engine"`
	EngineCapacity  *float64  `json:"engineCapacity"`  // litres, nil for pure EV
	BatteryCapacity *float64  `json:"batteryCapacity"` // kW/kWh, EV only
	Transmission    string    `json:"transmission"`
	Drive           string    `json:"drive"`
	BodyType        string    `json:"bodyType"`
	Color           string    `json:"color"`
	Seats           int       `json:"seats"`
	Description     string    `json:"description"`
	StatusID        uint      `json:"statusId" gorm:"not null"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (Car) TableName() string {
	return "cars"
}

// CarCardImage is the single thumbnail image shown on catalogue cards.
type CarCardImage struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	CarID    uint   `json:"carId" gorm:"not null;unique"`
	ImageSrc string `json:"imageSrc" gorm:"not null"`
}

func (CarCardImage) TableName() string {
	return "car_card_images"
}

// CarGalleryImage is one image of a car's carousel gallery.
type CarGalleryImage struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	CarID    uint   `json:"carId" gorm:"not null"`
	ImageSrc string `json:"imageSrc" gorm:"not null"`
	Position int    `json:"position"`
}

func (CarGalleryImage) TableName() string {
	return "car_gallery_images"
}
