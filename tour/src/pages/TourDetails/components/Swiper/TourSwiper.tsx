import { useState, useEffect, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { imageService } from '../../../../services/ImageService';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './TourSwiper.scss';

interface Tour {
  tourID: number;
  image_src: string;
  title?: string;
  description?: string;
}

export const TourSwiper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<number, string>>(new Map());

  const {
    isPending,
    error,
    data: tours = [],
    refetch,
  } = useQuery({
    queryKey: ['toursData', id],
    queryFn: async () => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/tour-carousel/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: Tour[] = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid response format');
      return data.filter((t) => t.image_src);
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!id,
  });

  const displayTours = tours.slice(0, 4);

  // Build image URLs synchronously first so slides render immediately,
  // then preload in the background without blocking the UI.
  useEffect(() => {
    if (displayTours.length === 0) return;

    // Set URLs immediately so images can start loading via the browser
    const urlMap = new Map<number, string>();
    displayTours.forEach((tour) => {
      urlMap.set(tour.tourID, imageService.getImageUrl(tour.image_src));
    });
    setImageUrls(urlMap);

    // Background preload — fire and forget, never await in render path
    imageService
      .preloadImages(
        displayTours.map((t) => t.image_src),
        { priority: 'high', concurrency: 4 }
      )
      .catch(() => {
        // Silently ignore — native img tags will still load images
      });
  }, [displayTours.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSlideChange = useCallback((s: SwiperType) => {
    setActiveIndex(s.activeIndex);
  }, []);

  if (isPending) {
    return (
      <div className="tour-swiper">
        <div className="tour-swiper__loading" role="status">
          <div className="tour-swiper__loading-spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-swiper">
        <div className="tour-swiper__error" role="alert">
          <p>Не вдалося завантажити зображення</p>
          <button onClick={() => refetch()} type="button">
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  if (displayTours.length === 0) {
    return (
      <div className="tour-swiper">
        <div className="tour-swiper__empty" role="status">
          <p>Зображення відсутні</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-swiper" role="region" aria-label="Tour image gallery">
      <Swiper
        modules={[Pagination, A11y, Navigation]}
        slidesPerView={1}
        spaceBetween={0}
        navigation
        pagination={{ clickable: true, dynamicBullets: displayTours.length > 5 }}
        onSlideChange={handleSlideChange}
        onSwiper={setSwiper}
        className="tour-swiper__container"
      >
        {displayTours.map((tour, index) => {
          const url = imageUrls.get(tour.tourID) || imageService.getImageUrl(tour.image_src);
          return (
            <SwiperSlide
              key={`tour-${tour.tourID || index}`}
              className="tour-swiper__slide"
            >
              <div
                className="tour-swiper__slide-image"
                style={{ backgroundImage: `url(${url})` }}
                role="img"
                aria-label={tour.title || `Tour image ${index + 1}`}
              />
              <div className="tour-swiper__slide-overlay" aria-hidden="true" />
            </SwiperSlide>
          );
        })}
      </Swiper>

      {displayTours.length > 1 && (
        <div
          className="tour-swiper__counter"
          aria-live="polite"
          aria-label={`Image ${activeIndex + 1} of ${displayTours.length}`}
        >
          {activeIndex + 1} / {displayTours.length}
        </div>
      )}
    </div>
  );
};