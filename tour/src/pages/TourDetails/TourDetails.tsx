import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import { OptimizedImage } from '../../components/OptimizedImage';
import { imageService } from '../../services/ImageService';
import { useImagePreload } from '../../hooks/useImagePreload';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import './TourDetails.scss';

interface TourCarouselImage {
  tourID: number;
  image_src: string;
}

interface TourDetails {
  id: number;
  title: string;
  description: string;
  detailedDescription: string;
  price: number;
  rating: number;
  duration: number;
  availableSeats: number;
  totalSeats: number;
}

export const TourDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<TourDetails | null>(null);
  const [carouselImages, setCarouselImages] = useState<TourCarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  const { isLoading: imagesLoading, progress } = useImagePreload(
    carouselImages.map(img => img.image_src)
  );

  useEffect(() => {
    if (!id) return;
    fetchTourData();
  }, [id]);

  const fetchTourData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Паралельно завантажуємо деталі та галерею
      const [detailsResponse, carouselResponse] = await Promise.all([
        fetch(`http://127.0.0.1:1323/tours/${id}`, {
          credentials: 'include',
        }),
        fetch(`http://127.0.0.1:1323/tour-carousel/${id}`, {
          credentials: 'include',
        }),
      ]);

      if (!detailsResponse.ok || !carouselResponse.ok) {
        throw new Error('Failed to fetch tour data');
      }

      const tourData = await detailsResponse.json();
      const imagesData = await carouselResponse.json();

      setTour(tourData);
      setCarouselImages(imagesData);

      if (imagesData.length > 0) {
        imageService.preloadImage(imagesData[0].image_src);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tour data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tour-details-loading">
        <div className="skeleton-gallery" />
        <div className="skeleton-content" />
      </div>
    );
  }

  if (!tour || carouselImages.length === 0) {
    return (
      <div className="tour-details-error">
        <p>Тур не знайдено або зображення відсутні</p>
      </div>
    );
  }

  return (
    <div className="tour-details">
      {/* Індикатор завантаження зображень */}
      {imagesLoading && (
        <div className="tour-details__loading-bar">
          <div 
            className="tour-details__loading-progress" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Головна галерея */}
      <div className="tour-details__gallery">
        <Swiper
          modules={[Navigation, Pagination, Thumbs]}
          spaceBetween={10}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          thumbs={{ swiper: thumbsSwiper }}
          className="tour-details__main-swiper"
        >
          {carouselImages.map((image, index) => (
            <SwiperSlide key={`${image.tourID}-${index}`}>
              {/* 🚀 ВИКОРИСТОВУЄМО OptimizedImage */}
              <OptimizedImage
                src={image.image_src}
                alt={`${tour.title} - Image ${index + 1}`}
                className="tour-details__slide-image"
                // Перше зображення - eager, решта - lazy
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Thumbnails */}
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          className="tour-details__thumbs-swiper"
          breakpoints={{
            640: { slidesPerView: 4 },
            768: { slidesPerView: 6 },
            1024: { slidesPerView: 8 },
          }}
        >
          {carouselImages.map((image, index) => (
            <SwiperSlide key={`thumb-${image.tourID}-${index}`}>
              <OptimizedImage
                src={image.image_src}
                alt={`Thumbnail ${index + 1}`}
                className="tour-details__thumb-image"
                loading="lazy"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Інформація про тур */}
      <div className="tour-details__info">
        <h1 className="tour-details__title">{tour.title}</h1>
        
        <div className="tour-details__meta">
          <div className="meta-item">
            <span className="meta-label">Ціна</span>
            <span className="meta-value">${tour.price}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Рейтинг</span>
            <span className="meta-value">⭐ {tour.rating}/5</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Тривалість</span>
            <span className="meta-value">📅 {tour.duration} днів</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Місця</span>
            <span className="meta-value">
              🪑 {tour.availableSeats}/{tour.totalSeats}
            </span>
          </div>
        </div>

        <div className="tour-details__description">
          <h2>Про тур</h2>
          <p>{tour.description}</p>
        </div>

        <div className="tour-details__detailed">
          <h2>Детальний опис</h2>
          <div 
            dangerouslySetInnerHTML={{ __html: tour.detailedDescription }}
          />
        </div>
      </div>
    </div>
  );
};