import React, { useState } from "react";
import { Card, CardFooter, Image, Button, Skeleton, Chip } from "@heroui/react";
import { Link } from "react-router-dom";
import { 
  Heart, 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  RefreshCw,
  Eye,
  Calendar
} from "lucide-react";
import "./Cards.scss";

interface Tour {
  id: number;
  title: string;
  description?: string;
  price: number;
  imageSrc: string;
  rating?: number;
  duration?: string;
  location?: string;
  participants?: number;
  isPopular?: boolean;
  discount?: number;
}

interface CardsProps {
  tours: Tour[];
  loading: boolean;
  onRetry?: () => void;
  onFavoriteToggle?: (tourId: number) => void;
  favorites?: number[];
}

export const Cards: React.FC<CardsProps> = ({ 
  tours, 
  loading, 
  onRetry,
  onFavoriteToggle,
  favorites = []
}) => {
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (tourId: number) => {
    setLoadingImages(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(tourId);
      return newSet;
    });
  };

  const handleImageError = (tourId: number) => {
    setFailedImages(prev => new Set([...Array.from(prev), tourId]));
    setLoadingImages(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(tourId);
      return newSet;
    });
  };

  const handleFavoriteClick = (e: React.MouseEvent, tourId: number) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(tourId);
  };

  const formatPrice = (price: number, discount?: number) => {
    if (discount) {
      const discountedPrice = price - (price * discount / 100);
      return {
        original: price,
        final: discountedPrice,
        discount
      };
    }
    return { final: price };
  };

  // Loading State
  if (loading) {
    return (
      <div className="cards-container">
        <div className="cards-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="card-skeleton">
              <Skeleton className="card-skeleton__image">
                <div className="card-skeleton__image-placeholder"></div>
              </Skeleton>
              <CardFooter className="card-skeleton__footer">
                <div className="card-skeleton__content">
                  <Skeleton className="card-skeleton__title">
                    <div className="h-4 w-3/4 rounded-lg bg-default-200"></div>
                  </Skeleton>
                  <Skeleton className="card-skeleton__price">
                    <div className="h-3 w-1/2 rounded-lg bg-default-200"></div>
                  </Skeleton>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (!Array.isArray(tours)) {
    return (
      <div className="error-state">
        <div className="error-state__content">
          <div className="error-state__icon">⚠️</div>
          <h3 className="error-state__title">Помилка завантаження</h3>
          <p className="error-state__description">
            Не вдалося завантажити тури. Перевірте з'єднання з інтернетом.
          </p>
          <Button
            color="primary"
            variant="flat"
            startContent={<RefreshCw size={16} />}
            onClick={onRetry}
            className="error-state__button"
          >
            Спробувати знову
          </Button>
        </div>
      </div>
    );
  }

  // Empty State
  if (tours.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__content">
          <div className="empty-state__icon">🔍</div>
          <h3 className="empty-state__title">Нічого не знайдено</h3>
          <p className="empty-state__description">
            Спробуйте змінити параметри пошуку або фільтри
          </p>
          <div className="empty-state__suggestions">
            <span>Популярні напрямки:</span>
            <div className="suggestions-list">
              <Chip size="sm" variant="flat">Карпати</Chip>
              <Chip size="sm" variant="flat">Київ</Chip>
              <Chip size="sm" variant="flat">Львів</Chip>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cards-container">
      <div className="cards-grid">
        {tours.map((tour) => {
          const priceInfo = formatPrice(tour.price, tour.discount);
          const isFavorite = favorites.includes(tour.id);
          const isImageLoading = loadingImages.has(tour.id);
          const isImageFailed = failedImages.has(tour.id);

          return (
            <div key={tour.id} className="card-wrapper">
              <Link to={`/TourDetails/${tour.id}`} className="card-link">
                <Card isPressable className="tour-card">
                  {/* Image Container */}
                  <div className="card-image-container">
                    {tour.isPopular && (
                      <Chip 
                        size="sm" 
                        color="warning" 
                        variant="solid"
                        className="card-badge card-badge--popular"
                        startContent={<Star size={12} />}
                      >
                        Популярний
                      </Chip>
                    )}
                    
                    {tour.discount && (
                      <Chip 
                        size="sm" 
                        color="danger" 
                        variant="solid"
                        className="card-badge card-badge--discount"
                      >
                        -{tour.discount}%
                      </Chip>
                    )}

                    <button
                      className={`card-favorite ${isFavorite ? 'card-favorite--active' : ''}`}
                      onClick={(e) => handleFavoriteClick(e, tour.id)}
                      aria-label={isFavorite ? "Видалити з улюблених" : "Додати в улюблені"}
                    >
                      <Heart 
                        size={18} 
                        fill={isFavorite ? "currentColor" : "none"}
                      />
                    </button>

                    {isImageFailed ? (
                      <div className="card-image-placeholder">
                        <MapPin size={32} />
                        <span>Зображення недоступне</span>
                      </div>
                    ) : (
                      <Image
                        radius="none"
                        width="100%"
                        height="100%"
                        alt={tour.title}
                        src={`http://127.0.0.1:1323${tour.imageSrc}`}
                        className="card-image"
                        onLoad={() => handleImageLoad(tour.id)}
                        onError={() => handleImageError(tour.id)}
                        loading="lazy"
                      />
                    )}

                    <div className="card-overlay">
                      <Button
                        size="sm"
                        variant="solid"
                        color="primary"
                        startContent={<Eye size={16} />}
                        className="card-view-btn"
                      >
                        Переглянути
                      </Button>
                    </div>

                    <div className="card-gradient"></div>
                  </div>

                  {/* Card Footer */}
                  <CardFooter className="card-footer">
                    <div className="card-content">
                      <div className="card-header">
                        <h3 className="card-title">{tour.title}</h3>
                        {tour.rating && (
                          <div className="card-rating">
                            <Star size={14} fill="currentColor" />
                            <span>{tour.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-details">
                        {tour.location && (
                          <div className="card-detail">
                            <MapPin size={12} />
                            <span>{tour.location}</span>
                          </div>
                        )}
                        
                        {tour.duration && (
                          <div className="card-detail">
                            <Calendar size={12} />
                            <span>{tour.duration}</span>
                          </div>
                        )}

                        {tour.participants && (
                          <div className="card-detail">
                            <Users size={12} />
                            <span>до {tour.participants} осіб</span>
                          </div>
                        )}
                      </div>

                      <div className="card-price-section">
                        {priceInfo.discount ? (
                          <div className="price-with-discount">
                            <span className="price-original">₴{priceInfo.original}</span>
                            <span className="price-final">₴{priceInfo.final}</span>
                          </div>
                        ) : (
                          <span className="price-final">₴{priceInfo.final}</span>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};