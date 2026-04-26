import React, { useState, useEffect, useCallback } from 'react';
import { Pagination, A11y, Autoplay, Navigation, EffectFade } from 'swiper/modules';
import { Swiper as SwiperBase, SwiperSlide } from 'swiper/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader } from '../Loader/Loader';
import { imageService } from '../../../../services/ImageService';
import { MapPin, ArrowRight, ChevronRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import './Swiper.scss';

interface Tour {
  id: number;
  title: string;
  description: string;
  callToAction: string;
  imageSrc: string;
}

export const Swiper: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);

  const { isPending, error, data } = useQuery({
    queryKey: ['toursData'],
    queryFn: async () => {
      const response = await fetch('/api/tourswiper');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json() as Promise<Tour[]>;
    },
  });

  const tours = data?.slice(0, 5) || [];

  useEffect(() => {
    if (tours.length === 0) return;
    // Preload first image immediately, rest in background
    const first = tours[0];
    if (first) {
      imageService.preloadImage(first.imageSrc, { priority: 'high' })
        .then(() => setImagesReady(true))
        .catch(() => setImagesReady(true));
    }
    setTimeout(() => {
      imageService.preloadImages(
        tours.slice(1).map(t => t.imageSrc),
        { priority: 'low', concurrency: 2 }
      ).catch(() => {});
    }, 300);
  }, [tours.length]);

  if (isPending) {
    return <div className="hs__loading"><Loader /></div>;
  }

  if (error || !data || tours.length === 0) {
    return (
      <div className="hs__empty">
        <MapPin size={40} />
        <h3>Тури скоро з'являться</h3>
        <Link to="/Tours">Переглянути каталог</Link>
      </div>
    );
  }

  return (
    <section className="hs">
      <SwiperBase
        modules={[Pagination, Navigation, A11y, Autoplay, EffectFade]}
        slidesPerView={1}
        effect="fade"
        speed={800}
        navigation={{
          nextEl: '.hs__nav--next',
          prevEl: '.hs__nav--prev',
        }}
        pagination={{
          el: '.hs__dots',
          clickable: true,
          bulletClass: 'hs__dot',
          bulletActiveClass: 'hs__dot--active',
        }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        onSlideChange={(s: any) => setActiveIndex(s.activeIndex)}
        className="hs__swiper"
      >
        {tours.map((tour, i) => {
          const imgUrl = imageService.getImageUrl(tour.imageSrc);
          return (
            <SwiperSlide key={tour.id} className="hs__slide">
              {/* Background image */}
              <div className="hs__bg">
                <img
                  src={imgUrl}
                  alt={tour.title}
                  className="hs__bg-img"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>

              {/* Gradient overlay */}
              <div className="hs__overlay" />

              {/* Content */}
              <div className="hs__content">
                <h1 className="hs__title">{tour.title}</h1>
                <p className="hs__desc">{tour.description}</p>
                <div className="hs__actions">
                  <Link to={`/TourDetails/${tour.id}`} className="hs__btn hs__btn--primary">
                    {tour.callToAction}
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/Tours" className="hs__btn hs__btn--ghost">
                    Усі тури
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Slide counter */}
              <div className="hs__counter">
                <span className="hs__counter-current">{String(i + 1).padStart(2, '0')}</span>
                <span className="hs__counter-sep">/</span>
                <span className="hs__counter-total">{String(tours.length).padStart(2, '0')}</span>
              </div>
            </SwiperSlide>
          );
        })}
      </SwiperBase>

      {/* Custom navigation */}
      <button className="hs__nav hs__nav--prev" aria-label="Previous">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button className="hs__nav hs__nav--next" aria-label="Next">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Custom dots */}
      <div className="hs__dots" />

      {/* Scroll hint */}
      <div className="hs__scroll-hint">
        <div className="hs__scroll-line" />
      </div>
    </section>
  );
};