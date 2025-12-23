import React, { useEffect, useState } from 'react';
import { Card, CardBody, Pagination, Spinner } from '@heroui/react';
import { OptimizedImage } from '../../components/OptimizedImage';
import { imageService } from '../../services/ImageService';
import './SearchResults.scss';

interface SearchTour {
  id: number;
  title: string;
  price: number;
  rating: number;
  imageSrc: string;
  duration: number | null;
  location: string;
  region: string;
}

interface SearchFilters {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxRating?: number;
  minDuration?: number;
  maxDuration?: number;
  regions?: string[];
}

interface SearchResultsProps {
  filters: SearchFilters;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ filters }) => {
  const [tours, setTours] = useState<SearchTour[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    searchTours();
  }, [filters, page]);

  const searchTours = async () => {
    try {
      setLoading(true);

      // Формуємо параметри запиту
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: 'rating_desc',
      });

      // Додаємо фільтри
      if (filters.title) params.append('title', filters.title);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.minRating) params.append('minRating', filters.minRating.toString());
      if (filters.maxRating) params.append('maxRating', filters.maxRating.toString());
      if (filters.minDuration) params.append('minDuration', filters.minDuration.toString());
      if (filters.maxDuration) params.append('maxDuration', filters.maxDuration.toString());
      if (filters.regions && filters.regions.length > 0) {
        params.append('region', filters.regions.join(','));
      }

      // 🚀 Використовуємо ваш /search endpoint
      const response = await fetch(
        `http://127.0.0.1:1323/search?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      setTours(data.tours || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      // 🚀 Предзавантажуємо зображення всіх результатів
      if (data.tours && data.tours.length > 0) {
        const images = data.tours.map((tour: SearchTour) => tour.imageSrc);
        imageService.preloadImages(images);
      }

      setLoading(false);
    } catch (error) {
      console.error('Search failed:', error);
      setLoading(false);
    }
  };

  if (loading && tours.length === 0) {
    return (
      <div className="search-results-loading">
        <Spinner size="lg" />
        <p>Шукаємо тури...</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      {/* Заголовок з кількістю результатів */}
      <div className="search-results__header">
        <h2>Знайдено турів: {total}</h2>
        {loading && <Spinner size="sm" />}
      </div>

      {/* Результати пошуку */}
      {tours.length === 0 ? (
        <div className="search-results__empty">
          <p>Тури не знайдено за вказаними критеріями</p>
          <p className="text-sm text-gray-500">
            Спробуйте змінити фільтри пошуку
          </p>
        </div>
      ) : (
        <>
          <div className="search-results__grid">
            {tours.map((tour, index) => (
              <Card 
                key={tour.id} 
                className="search-result-card"
                isPressable
                onPress={() => {
                  window.location.href = `/tours/${tour.id}`;
                }}
              >
                {/* 🚀 ВИКОРИСТОВУЄМО OptimizedImage */}
                <OptimizedImage
                  src={tour.imageSrc}
                  alt={tour.title}
                  className="search-result-card__image"
                  // Перші 6 - eager, решта - lazy
                  loading={index < 6 ? 'eager' : 'lazy'}
                />
                
                <CardBody className="search-result-card__body">
                  <h3 className="search-result-card__title">{tour.title}</h3>
                  
                  <div className="search-result-card__meta">
                    {tour.location && (
                      <span className="meta-item">
                        📍 {tour.location}
                      </span>
                    )}
                    {tour.duration && (
                      <span className="meta-item">
                        📅 {tour.duration} днів
                      </span>
                    )}
                  </div>

                  <div className="search-result-card__footer">
                    <div className="rating">
                      ⭐ {tour.rating}/5
                    </div>
                    <div className="price">
                      <span className="price-value">${tour.price}</span>
                      <span className="price-label">за особу</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Пагінація */}
          {totalPages > 1 && (
            <div className="search-results__pagination">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                showControls
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};