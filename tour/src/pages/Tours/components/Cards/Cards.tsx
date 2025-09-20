import React, { useState, useCallback } from "react";
import { Card, CardFooter, Image, Button, Skeleton, Chip } from "@heroui/react";
import { Link } from "react-router-dom";
import { 
  Heart, 
  MapPin, 
  Star, 
  RefreshCw,
  Eye,
  Calendar,
  Users,
  Clock
} from "lucide-react";
import { useAuth } from '../../../../context/AuthContext';
import { useToggleFavorite, useIsFavorite } from '../../../../hooks/useFavorites';
import { Tour } from '../../../../types/tours';
import "./Cards.scss";

interface CardsProps {
  tours: Tour[];
  loading: boolean;
  onRetry?: () => void;
}

export const Cards: React.FC<CardsProps> = ({ 
  tours, 
  loading, 
  onRetry
}) => {
  const { isAuthenticated } = useAuth();
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = useCallback((tourId: number) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(tourId);
      return newSet;
    });
  }, []);

  const handleImageError = useCallback((tourId: number) => {
    setFailedImages(prev => new Set([...prev, tourId]));
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(tourId);
      return newSet;
    });
  }, []);

  const formatPrice = (price: number, discount?: number) => {
    if (discount && discount > 0) {
      const discountedPrice = price - (price * discount / 100);
      return {
        original: price,
        final: Math.round(discountedPrice),
        discount
      };
    }
    return { final: Math.round(price) };
  };

  const FavoriteButton: React.FC<{ tourId: number }> = ({ tourId }) => {
    const isFavorite = useIsFavorite(tourId);
    const { toggleFavorite, isLoading } = useToggleFavorite();

    const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isAuthenticated) {
        // Показати toast або модальне окно з пропозицією увійти
        alert('Увійдіть у свій акаунт, щоб додавати тури в обране');
        return;
      }

      toggleFavorite(tourId);
    }, [tourId, isAuthenticated, toggleFavorite]);

    return (
      <button
        className={`card-favorite ${isFavorite ? 'card-favorite--active' : ''}`}
        onClick={handleFavoriteClick}
        disabled={isLoading}
        aria-label={isFavorite ? "Видалити з улюблених" : "Додати в улюблені"}
      >
        <Heart 
          size={18} 
          fill={isFavorite ? "currentColor" : "none"}
        />
      </button>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="cards-container">
        <div className="cards-grid">
          {Array.from({ length: 12 }).map((_, index) => (
            <Card key={index} className="card-skeleton">
              <Skeleton className="card-skeleton__image">
                <div className="card-skeleton__image-placeholder"></div>
              </Skeleton>
              <CardFooter className="card-skeleton__footer">
                <div className="card-skeleton__content">
                  <Skeleton className="card-skeleton__title">
                    <div className="h-4 w-3/4 rounded-lg bg-default-200"></div>
                  </Skeleton>
                  <Skeleton className="card-skeleton__detail">
                    <div className="h-3 w-1/2 rounded-lg bg-default-200"></div>
                  </Skeleton>
                  <Skeleton className="card-skeleton__price">
                    <div className="h-5 w-2/3 rounded-lg bg-default-200"></div>
                  </Skeleton>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (!Array.isArray(tours)) {
    return (
      <div className="error-state">
        <div className="error-state__content">
          <div className="error-state__icon">⚠️</div>
          <h3 className="error-state__title">Помилка завантаження</h3>
          <p className="error-state__description">
            Не вдалося завантажити тури. Перевірте з'єднання з інтернетом та спробуйте ще раз.
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

  // Empty state
  if (tours.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__content">
          <div className="empty-state__icon">🔍</div>
          <h3 className="empty-state__title">Нічого не знайдено</h3>
          <p className="empty-state__description">
            Спробуйте змінити параметри пошуку або фільтри, щоб знайти підходящі тури.
          </p>
          <div className="empty-state__suggestions">
            <span>Популярні напрямки:</span>
            <div className="suggestions-list">
              <Chip size="sm" variant="flat" color="primary">Єгипет</Chip>
              <Chip size="sm" variant="flat" color="primary">Дубай</Chip>
              <Chip size="sm" variant="flat" color="primary">Бостон</Chip>
              <Chip size="sm" variant="flat" color="primary">Мальдіви</Chip>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tours grid
  return (
    <div className="cards-container">
      <div className="cards-grid">
        {tours.map((tour) => {
          const priceInfo = formatPrice(tour.price, tour.discount);
          const isImageFailed = failedImages.has(tour.id);
          const isImageLoading = loadingImages.has(tour.id);

          return (
            <div key={tour.id} className="card-wrapper">
              <Card className="tour-card">
                <div className="card-image-container">
                  {/* Badges */}
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
                  
                  {tour.discount && tour.discount > 0 && (
                    <Chip 
                      size="sm" 
                      color="danger" 
                      variant="solid"
                      className="card-badge card-badge--discount"
                    >
                      -{tour.discount}%
                    </Chip>
                  )}

                  {/* Favorite button */}
                  <FavoriteButton tourId={tour.id} />

                  {/* Image */}
                  {isImageFailed ? (
                    <div className="card-image-placeholder">
                      <MapPin size={32} />
                      <span>Зображення недоступне</span>
                    </div>
                  ) : (
                    <>
                      {isImageLoading && (
                        <div className="card-image-loading">
                          <Skeleton className="w-full h-full" />
                        </div>
                      )}
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
                    </>
                  )}

                  {/* Overlay with view button */}
                  <Link to={`/TourDetails/${tour.id}`} className="card-overlay-link">
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
                  </Link>

                  <div className="card-gradient"></div>
                </div>
                
                <CardFooter className="card-footer">
                  <Link to={`/TourDetails/${tour.id}`} className="card-content-link">
                    <div className="card-content">
                      <div className="card-header">
                        <h3 className="card-title">{tour.title}</h3>
                        {tour.rating && tour.rating > 0 && (
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
                            <Clock size={12} />
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
                            <span className="price-original">₴{priceInfo.original?.toLocaleString()}</span>
                            <span className="price-final">₴{priceInfo.final.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="price-final">₴{priceInfo.final.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};