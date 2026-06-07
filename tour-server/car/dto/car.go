package dto

// CarCard is the compact representation used in catalogue grids and swipers.
type CarCard struct {
	ID       uint    `json:"id" gorm:"column:id"`
	Make     string  `json:"make" gorm:"column:make"`
	Model    string  `json:"model" gorm:"column:model"`
	Year     int     `json:"year" gorm:"column:year"`
	Price    float64 `json:"price" gorm:"column:price"`
	Mileage  int     `json:"mileage" gorm:"column:mileage"`
	FuelType string  `json:"fuelType" gorm:"column:fuel_type"`
	BodyType string  `json:"bodyType" gorm:"column:body_type"`
	ImageSrc string  `json:"imageSrc" gorm:"column:image_src"`
}

// CarDetail is the full representation used on a car's detail page.
type CarDetail struct {
	ID              uint     `json:"id" gorm:"column:id"`
	Make            string   `json:"make" gorm:"column:make"`
	Model           string   `json:"model" gorm:"column:model"`
	Year            int      `json:"year" gorm:"column:year"`
	VIN             string   `json:"vin" gorm:"column:vin"`
	Price           float64  `json:"price" gorm:"column:price"`
	Mileage         int      `json:"mileage" gorm:"column:mileage"`
	FuelType        string   `json:"fuelType" gorm:"column:fuel_type"`
	Engine          string   `json:"engine" gorm:"column:engine"`
	EngineCapacity  *float64 `json:"engineCapacity" gorm:"column:engine_capacity"`
	BatteryCapacity *float64 `json:"batteryCapacity" gorm:"column:battery_capacity"`
	Transmission    string   `json:"transmission" gorm:"column:transmission"`
	Drive           string   `json:"drive" gorm:"column:drive"`
	BodyType        string   `json:"bodyType" gorm:"column:body_type"`
	Color           string   `json:"color" gorm:"column:color"`
	Seats           int      `json:"seats" gorm:"column:seats"`
	Description     string   `json:"description" gorm:"column:description"`
	StatusID        uint     `json:"statusId" gorm:"column:status_id"`
	Status          string   `json:"status" gorm:"column:status"`
	CardImage       string   `json:"cardImage" gorm:"column:card_image"`
}

// GalleryImage is one carousel image returned for a car.
type GalleryImage struct {
	ID       uint   `json:"id" gorm:"column:id"`
	ImageSrc string `json:"imageSrc" gorm:"column:image_src"`
}
