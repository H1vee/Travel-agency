import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Clock, Star, ArrowUpRight } from "lucide-react";
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

const TourCard: React.FC<{ tour: Tour; index: number }> = ({ tour, index }) => {
  const { isAuthenticated } = useAuth();
  const isFavorite = useIsFavorite(tour.id);
  const { toggleFavorite, isLoading: favLoading } = useToggleFavorite();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  const finalPrice = tour.discount != null && tour.discount > 0
    ? tour.price * (1 - tour.discount / 100)
    : tour.price;

  return (
    <Link
      to={`/TourDetails/${tour.id}`}
      className="tc"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
    >
      <div className="tc__photo">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={tour.title}
            className={`tc__photo-img ${imgLoaded ? 'tc__photo-img--in' : ''}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="tc__photo-missing">
            <MapPin size={24} />
            <span>Фото відсутнє</span>
          </div>
        )}

        <div className="tc__photo-grad" />

        {(tour.isPopular || (tour.discount != null && tour.discount > 0)) && (
          <div className="tc__badges">
            {tour.isPopular && <span className="tc__badge tc__badge--pop">Хіт</span>}
            {tour.discount != null && tour.discount > 0 && (
              <span className="tc__badge tc__badge--off">−{tour.discount}%</span>
            )}
          </div>
        )}

        <button
          className={`tc__fav ${isFavorite ? 'tc__fav--on' : ''}`}
          onClick={handleFavorite}
          disabled={favLoading}
          aria-label="Обране"
        >
          <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <div className="tc__photo-bottom">
          <h3 className="tc__name">{tour.title}</h3>
          <div className="tc__photo-meta">
            {tour.location && (
              <span className="tc__loc"><MapPin size={11} />{tour.location}</span>
            )}
            {tour.duration && (
              <span className="tc__dur"><Clock size={11} />{tour.duration}</span>
            )}
          </div>
        </div>
      </div>

      <div className="tc__foot">
        <div className="tc__rating">
          {tour.rating && tour.rating > 0 ? (
            <>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span className="tc__rating-num">{tour.rating.toFixed(1)}</span>
            </>
          ) : null}
        </div>

        <div className="tc__price-row">
          <div className="tc__price-block">
            {tour.discount != null && tour.discount > 0 && (
              <span className="tc__price-was">{formatPrice(tour.price)}</span>
            )}
            <span className="tc__price">{formatPrice(finalPrice)}</span>
          </div>
          <div className="tc__go"><ArrowUpRight size={16} /></div>
        </div>
      </div>
    </Link>
  );
};

const Skeleton: React.FC = () => (
  <div className="tc tc--skeleton">
    <div className="tc__photo tc__sk-photo" />
    <div className="tc__foot">
      <div className="tc__sk-line" style={{ width: '40%', height: 12 }} />
      <div className="tc__sk-line" style={{ width: '55%', height: 18 }} />
    </div>
  </div>
);

export const Cards: React.FC<CardsProps> = ({ tours, loading, onRetry }) => {
  useEffect(() => {
    if (tours.length) {
      imageService.preloadImages(tours.map(t => t.imageSrc), { priority: 'medium', concurrency: 4 }).catch(() => {});
    }
  }, [tours]);

  if (loading) {
    return (
      <div className="cards-grid">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (!Array.isArray(tours) || tours.length === 0) {
    return (
      <div className="cards-empty">
        <span className="cards-empty__emoji">{!Array.isArray(tours) ? '⚠️' : '🔍'}</span>
        <strong>{!Array.isArray(tours) ? 'Помилка завантаження' : 'Нічого не знайдено'}</strong>
        <p>{!Array.isArray(tours) ? 'Не вдалося завантажити тури' : 'Спробуйте змінити параметри пошуку'}</p>
        {!Array.isArray(tours) && onRetry && (
          <button className="cards-empty__retry" onClick={onRetry}>Спробувати знову</button>
        )}
      </div>
    );
  }

  return (
    <div className="cards-grid">
      {tours.map((tour, i) => <TourCard key={tour.id} tour={tour} index={i} />)}
    </div>
  );
};