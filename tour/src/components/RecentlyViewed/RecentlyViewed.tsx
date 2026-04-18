import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecentViews, useClearViewHistory, useRemoveFromHistory } from '../../hooks/useViewHistory';
import { useAuth } from '../../context/AuthContext';
import { imageService } from '../../services/ImageService';
import { Clock, X, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import './RecentlyViewed.scss';

export const RecentlyViewed: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { data: views, isLoading } = useRecentViews(10);
  const clearHistory = useClearViewHistory();
  const removeItem = useRemoveFromHistory();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  if (!isAuthenticated || isLoading || !views || views.length === 0) {
    return null;
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
    }).format(p);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  return (
    <div className="rv2">
      <div className="rv2__top">
        <div className="rv2__label">
          <Clock size={14} />
          <span>Переглянуті</span>
          <span className="rv2__count">{views.length}</span>
        </div>
        <button
          className="rv2__clear"
          onClick={() => clearHistory.mutate()}
          disabled={clearHistory.isPending}
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="rv2__track-wrap">
        {showLeft && (
          <button className="rv2__arrow rv2__arrow--l" onClick={() => scroll('left')}>
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="rv2__track" ref={scrollRef} onScroll={handleScroll}>
          {views.map((tour) => {
            const imgUrl = imageService.getImageUrl(tour.image_src);
            return (
              <Link
                key={tour.tour_id}
                to={`/TourDetails/${tour.tour_id}`}
                className="rv2__pill"
              >
                <div className="rv2__pill-img">
                  <img
                    src={imgUrl}
                    alt={tour.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/static/images/no-image.jpg';
                    }}
                  />
                </div>
                <div className="rv2__pill-body">
                  <span className="rv2__pill-name">{tour.title}</span>
                  <span className="rv2__pill-price">
                    {formatPrice(tour.price)}
                    {tour.rating > 0 && (
                      <span className="rv2__pill-rating">
                        <Star size={9} fill="#f59e0b" color="#f59e0b" />
                        {tour.rating.toFixed(1)}
                      </span>
                    )}
                  </span>
                </div>
                <button
                  className="rv2__pill-x"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeItem.mutate(tour.tour_id);
                  }}
                >
                  <X size={10} />
                </button>
              </Link>
            );
          })}
        </div>

        {showRight && views.length > 3 && (
          <button className="rv2__arrow rv2__arrow--r" onClick={() => scroll('right')}>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
