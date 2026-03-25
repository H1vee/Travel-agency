import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Clock, Eye, RefreshCw } from "lucide-react";
import { useAuth } from '../../../../context/AuthContext';
import { useToggleFavorite, useIsFavorite } from '../../../../hooks/useFavorites';
import { Tour } from '../../../../types/tours';
import { imageService } from '../../../../services/ImageService';
import "./Cards.scss";

interface CardsProps {
  tours: Tour[];
  loading: boolean;
  onRetry?: () => void;
}

// ─── Single card ──────────────────────────────────────────────────────────────

const TourCard: React.FC<{ tour: Tour }> = ({ tour }) => {
  const { isAuthenticated } = useAuth();
  const isFavorite = useIsFavorite(tour.id);
  const { toggleFavorite, isLoading: favLoading } = useToggleFavorite();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imageUrl = imageService.getImageUrl(tour.imageSrc);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Увійдіть, щоб додавати тури в обране');
      return;
    }
    toggleFavorite(tour.id);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(price);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="tc__stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={11}
            fill={i < full ? '#fbbf24' : (i === full && half ? '#fbbf24' : 'none')}
            color={i < full || (i === full && half) ? '#fbbf24' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  return (
    <Link to={`/TourDetails/${tour.id}`} className="tc">
      {/* ── Image ── */}
      <div className="tc__img-wrap">
        {!imgError ? (
          <>
            {!imgLoaded && <div className="tc__img-skeleton" />}
            <img
              src={imageUrl}
              alt={tour.title}
              className={`tc__img ${imgLoaded ? 'tc__img--loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className="tc__img-placeholder">
            <MapPin size={28} color="#cbd5e1" />
            <span>Фото відсутнє</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="tc__overlay" />

        {/* Top badges */}
        <div className="tc__top">
          {tour.isPopular && (
            <span className="tc__badge tc__badge--hot">🔥 Хіт</span>
          )}
          {tour.discount && tour.discount > 0 && (
            <span className="tc__badge tc__badge--sale">−{tour.discount}%</span>
          )}
        </div>

        {/* Favorite */}
        <button
          className={`tc__fav ${isFavorite ? 'tc__fav--active' : ''}`}
          onClick={handleFavorite}
          disabled={favLoading}
          aria-label={isFavorite ? 'Видалити з обраного' : 'Додати в обране'}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Hover CTA */}
        <div className="tc__cta">
          <Eye size={15} />
          <span>Детальніше</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="tc__body">
        <h3 className="tc__title">{tour.title}</h3>

        <div className="tc__meta">
          {tour.location && (
            <div className="tc__meta-item">
              <MapPin size={12} />
              <span>{tour.location}</span>
            </div>
          )}
          {tour.duration && (
            <div className="tc__meta-item">
              <Clock size={12} />
              <span>{tour.duration}</span>
            </div>
          )}
        </div>

        {/* Rating row */}
        {tour.rating && tour.rating > 0 ? (
          <div className="tc__rating">
            {renderStars(tour.rating)}
            <span className="tc__rating-val">{tour.rating.toFixed(1)}</span>
          </div>
        ) : (
          <div className="tc__rating tc__rating--none">
            <span>Без оцінок</span>
          </div>
        )}

        {/* Price */}
        <div className="tc__footer">
          <div className="tc__price-wrap">
            <span className="tc__price-label">від</span>
            {tour.discount && tour.discount > 0 ? (
              <div className="tc__price-discount">
                <span className="tc__price-old">
                  {formatPrice(tour.price)}
                </span>
                <span className="tc__price">
                  {formatPrice(tour.price * (1 - tour.discount / 100))}
                </span>
              </div>
            ) : (
              <span className="tc__price">{formatPrice(tour.price)}</span>
            )}
          </div>
          <div className="tc__arrow">→</div>
        </div>
      </div>
    </Link>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="tc tc--skeleton">
    <div className="tc__img-wrap tc__img-skeleton" />
    <div className="tc__body">
      <div className="sk-line sk-line--title" />
      <div className="sk-line sk-line--meta" />
      <div className="sk-line sk-line--rating" />
      <div className="sk-line sk-line--price" />
    </div>
  </div>
);

// ─── Cards grid ───────────────────────────────────────────────────────────────

export const Cards: React.FC<CardsProps> = ({ tours, loading, onRetry }) => {
  useEffect(() => {
    if (tours.length) {
      imageService.preloadImages(tours.map(t => t.imageSrc), { priority: 'medium', concurrency: 4 })
        .catch(() => {});
    }
  }, [tours]);

  if (loading) {
    return (
      <div className="cards-grid">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!Array.isArray(tours)) {
    return (
      <div className="cards-empty">
        <div className="cards-empty__icon">⚠️</div>
        <h3>Помилка завантаження</h3>
        <p>Не вдалося завантажити тури</p>
        <button className="cards-empty__btn" onClick={onRetry}>
          <RefreshCw size={15} /> Спробувати знову
        </button>
      </div>
    );
  }

  if (tours.length === 0) {
    return (
      <div className="cards-empty">
        <div className="cards-empty__icon">🔍</div>
        <h3>Нічого не знайдено</h3>
        <p>Спробуйте змінити параметри пошуку</p>
      </div>
    );
  }

  return (
    <div className="cards-grid">
      {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
    </div>
  );
};