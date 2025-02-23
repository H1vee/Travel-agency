package services

import (
	"fmt"
	"log"
	"tour-server/search/models"

	"github.com/coder/hnsw"
	"github.com/mabdh/go-fasttext"
	"gorm.io/gorm"
)

type SearchService struct {
	db    *gorm.DB
	graph *hnsw.Graph[int]
	model *fasttext.Model
}

func NewSearchService(db *gorm.DB) (*SearchService, error) {
	modelPath := "tour-server/search/FastTextModel"
	g := hnsw.NewGraph[int]()

	model, err := fasttext.New(modelPath)
	if err != nil {
		return nil, fmt.Errorf("Failed to load the FastText model: %v", err)
	}

	var tours []models.Tour
	if err := db.Table("tours").
		Select("tours.id, tours.title, tours.rating, tours.price, tour_dates.duration").
		Joins("left join tour_dates on tour_dates.tour_id = tours.id").
		Scan(&tours).Error; err != nil {
		return nil, fmt.Errorf("Failed to load tours with duration: %v", err)
	}

	for _, tour := range tours {
		result := model.Predict(tour.Title, 1, float32(0.01))
		if len(result) == 0 {
			log.Printf("Failed to get a result for the title %s", tour.Title)
			continue
		}
		label := result[0].Label

		labelVec := []float32{float32(len(label))}

		vector := append(labelVec, []float32{float32(tour.Rating), float32(tour.Price), float32(tour.Duration)}...)

		g.Add(hnsw.MakeNode(int(tour.ID), vector))
	}

	return &SearchService{db: db, graph: g, model: &model}, nil
}

func (s *SearchService) Search(query []float32, topN int) ([]models.Tour, error) {
	neighbors := s.graph.Search(query, topN)

	if len(neighbors) == 0 {
		return nil, fmt.Errorf("no immediate neighbors found")
	}

	var tours []models.Tour
	var ids []int
	for _, neighbor := range neighbors {
		ids = append(ids, neighbor.Key)
	}

	if err := s.db.Table("tours").
		Select("tours.id, tours.title, tours.raiting, tours.price, tour_dates.duration").
		Joins("LEFT JOIN tour_dates on tour_dates.tour_id = tours.id").
		Where("tours.id IN ?", ids).
		Scan(&tours).Error; err != nil {
		return nil, fmt.Errorf("Error when loading tours by ID: %w", err)
	}
	return tours, nil
}
