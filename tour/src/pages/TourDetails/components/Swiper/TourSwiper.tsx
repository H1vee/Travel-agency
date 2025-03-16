// TourSwiper.tsx
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Navigation, Virtual } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';

// Import styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './TourSwiper.scss';

// Types
interface Tour {
  tourID: number;
  image_src: string;
  title?: string;
}

interface TourSwiperProps {
  maxSlides?: number;
  height?: string;
  autoplay?: boolean;
}

export const TourSwiper: React.FC<TourSwiperProps> = ({
  maxSlides = 4,  
  height = '500px',
  autoplay = false
}) => {
  const { id } = useParams<{ id: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  
  // Fetch tour data
  const { 
    isPending, 
    error, 
    data: tours = []
  } = useQuery({
    queryKey: ['toursData', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/tour-carousel/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tours: ${response.status}`);
        }
        
        const data: Tour[] = await response.json();
        return data;
      } catch (err) {
        console.error('Error fetching tour data:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Prepare display data
  const displayTours = tours.slice(0, maxSlides);
  
  // Handle image load events
  const handleImageLoaded = (index: number) => {
    setImagesLoaded(prev => ({ ...prev, [index]: true }));
  };
  
  // Reset loaded state when tours change
  useEffect(() => {
    setImagesLoaded({});
  }, [tours]);

  // Preload images
  useEffect(() => {
    if (displayTours.length) {
      displayTours.forEach((tour, index) => {
        const img = new Image();
        img.onload = () => handleImageLoaded(index);
        img.src = `${process.env.REACT_APP_API_BASE_URL || ''}${tour.image_src}`;
      });
    }
  }, [displayTours]);

  // Loading state
  if (isPending) {
    return (
      <div className="tour-swiper__loading">
        <div className="tour-swiper__loading-spinner" aria-label="Loading tours" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tour-swiper__error" role="alert">
        <p>Unable to load tour images. Please try again later.</p>
      </div>
    );
  }

  // Empty state
  if (!displayTours.length) {
    return (
      <div className="tour-swiper__empty">
        <p>No tour images available</p>
      </div>
    );
  }

  return (
    <div className="tour-swiper" style={{ height }}>
      <Swiper
        modules={[Pagination, A11y, Navigation, Virtual]}
        slidesPerView={1}
        spaceBetween={0}
        navigation={true}
        pagination={{ 
          clickable: true,
          dynamicBullets: displayTours.length > 5
        }}
        virtual={true}
        onSlideChange={(swiper: SwiperType) => setActiveIndex(swiper.activeIndex)}
        autoplay={autoplay ? { delay: 5000, disableOnInteraction: false } : false}
        className="tour-swiper__container"
      >
        {displayTours.map((tour, index) => (
          <SwiperSlide 
            key={`tour-${tour.tourID}-${index}`} 
            virtualIndex={index}
            className="tour-swiper__slide"
          >
            {!imagesLoaded[index] && (
              <div className="tour-swiper__slide-loading" />
            )}
            <div 
              className="tour-swiper__slide-image"
              style={{ 
                backgroundImage: `url(${process.env.REACT_APP_API_BASE_URL || ''}${tour.image_src})`,
                opacity: imagesLoaded[index] ? 1 : 0
              }}
            />
            <div className="tour-swiper__slide-overlay" />
          </SwiperSlide>
        ))}
      </Swiper>
      
      {displayTours.length > 1 && (
        <div className="tour-swiper__counter" aria-live="polite">
          {activeIndex + 1} / {displayTours.length}
        </div>
      )}
    </div>
  );
};