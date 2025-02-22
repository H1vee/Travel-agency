package dto

type SearchResult struct {
	Query    string `json:"query"`
	Raiting  uint   `json:"raiting"`
	Duration uint   `json:"duration"`
}
