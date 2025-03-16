import React, { useState, useEffect } from 'react';
import { Pagination, A11y, Autoplay, Navigation, EffectFade } from 'swiper/modules';
import { Swiper as SwiperBase, SwiperSlide } from 'swiper/react';
import { Button } from "@heroui/react";
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader } from '../Loader/Loader';

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
  const [imgError, setImgError] = useState<{[key: number]: boolean}>({});
  
  const { isPending, error, data } = useQuery({
    queryKey: ['toursData'],
    queryFn: async() => {
      try {
        const response = await fetch('/api/tourswiper');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const tours: Tour[] = await response.json();
        return tours;
      } catch (err) {
        console.error('Failed to fetch tours:', err);
        throw err;
      }
    },
  });
  
  const handleImageError = (tourId: number) => {
    setImgError(prev => ({
      ...prev,
      [tourId]: true
    }));
    console.error(`Failed to load image for tour ${tourId}`);
  };
  
  // Preload images
  useEffect(() => {
    if (data) {
      data.slice(0, 4).forEach(tour => {
        const img = new Image();
        img.src = `http://localhost:1323${tour.imageSrc}`;
        img.onerror = () => handleImageError(tour.id);
      });
    }
  }, [data]);
  
  if (isPending) {
    return (
      <div className="swiper-loader-container">
        <Loader />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="swiper-error">
        <h3>Не вдалося завантажити тури</h3>
        <p>Спробуйте оновити сторінку або зв'яжіться з нами</p>
        <Button color="primary" onClick={() => window.location.reload()}>
          Спробувати знову
        </Button>
      </div>
    );
  }
  
  const tours = data.slice(0, 4);
  
  if (tours.length === 0) {
    return (
      <div className="swiper-empty">
        <h3>Немає доступних турів</h3>
        <Link to="/Tours">
          <Button color="primary">Переглянути всі тури</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="swiper-container">
      <SwiperBase
        modules={[Pagination, Navigation, A11y, Autoplay, EffectFade]}
        slidesPerView={1}
        pagination={{ 
          clickable: true,
          dynamicBullets: true
        }}
        navigation
        effect="fade"
        className="swiper"
        autoplay={{ 
          delay: 5000,
          disableOnInteraction: false
        }}
      >
        {tours.map(tour => (
          <SwiperSlide 
            key={tour.id} 
            className="swiper-slide"
          >
            <div 
              className="swiper-slide-background" 
              style={{
                backgroundImage: imgError[tour.id] 
                  ? 'url("/images/fallback-tour.jpg")' 
                  : `url("http://localhost:1323${tour.imageSrc}")`
              }}
            ></div>
            <div className="swiper-slide-overlay"></div>
            <div className="swiper-slide-wrapper">
              <h2 className="swiper-slide-title">{tour.title}</h2>
              <p className="swiper-slide-description">{tour.description}</p>
              <Link to={`/TourDetails/${tour.id}`} className="swiper-slide-link">
                <Button
                  className="swiper-slide-action"
                  variant="shadow"
                  color="secondary"
                  radius="full"
                  size="lg"
                >
                  {tour.callToAction}
                </Button>
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </SwiperBase>
    </div>
  );
};