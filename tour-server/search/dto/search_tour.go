package dto

type SearchTour struct {
	ID uint `json:"id"`
}

type SearchTourResult struct {
	ID        uint     `json:"id"`
	Title     string   `json:"title"`
	Price     float64  `json:"price"`
	Rating    float64  `json:"rating"`
	ImageSrc  string   `json:"imageSrc"`
	Duration  *int     `json:"duration,omitempty"`
	Location  string   `json:"location,omitempty"`
	Region    string   `json:"region,omitempty"`
}

type SearchFilters struct {
	Title       string   `json:"title,omitempty"`
	MinPrice    *float64 `json:"minPrice,omitempty"`
	MaxPrice    *float64 `json:"maxPrice,omitempty"`
	MinRating   *float64 `json:"minRating,omitempty"`
	MaxRating   *float64 `json:"maxRating,omitempty"`
	MinDuration *int     `json:"minDuration,omitempty"`
	MaxDuration *int     `json:"maxDuration,omitempty"`
	Regions     []string `json:"regions,omitempty"`
}

type SearchResponse struct {
	Tours       []SearchTourResult `json:"tours"`
	Total       int                `json:"total"`
	Page        int                `json:"page"`
	Limit       int                `json:"limit"`
	TotalPages  int                `json:"totalPages"`
	Filters     SearchFilters      `json:"appliedFilters"`
}