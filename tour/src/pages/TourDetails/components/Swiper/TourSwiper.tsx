// TourSwiper.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Navigation, Virtual, Autoplay, EffectFade, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';

// Import styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import './TourSwiper.scss';

// Types
interface Tour {
  tourID: number;
  image_src: string;
  title?: string;
  description?: string;
}

interface TourSwiperProps {
  maxSlides?: number;
  height?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  effect?: 'slide' | 'fade';
  showCounter?: boolean;
  showThumbnails?: boolean;
  enableKeyboard?: boolean;
  pauseOnHover?: boolean;
}

export const TourSwiper: React.FC<TourSwiperProps> = ({
  maxSlides = 4,  
  height = '500px',
  autoplay = false,
  autoplayDelay = 5000,
  effect = 'slide',
  showCounter = true,
  showThumbnails = false,
  enableKeyboard = true,
  pauseOnHover = true
}) => {
  const { id } = useParams<{ id: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  const { 
    isPending, 
    error, 
    data: tours = [],
    refetch
  } = useQuery({
    queryKey: ['toursData', id],
    queryFn: async () => {
      try {
        console.log('Fetching tour carousel for ID:', id);
        
        // Правильный URL для вашего Go сервера
        const response = await fetch(`http://127.0.0.1:1323/tour-carousel/${id}`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=300'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: Tour[] = await response.json();
        console.log('Received carousel data:', data);
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected array');
        }
        
        return data.filter(tour => tour.image_src);
      } catch (err) {
        console.error('Error fetching tour carousel:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, 
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!id, // Добавим проверку наличия ID
  });
  
  const displayTours = tours.slice(0, maxSlides);
  
  const preloadImage = useCallback((src: string, index: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Убираем базовый URL, так как изображения уже содержат полный путь от сервера
      const fullSrc = `http://127.0.0.1:1323${src}`;
      
      if (imageCache.current.has(fullSrc)) {
        setImagesLoaded(prev => ({ ...prev, [index]: true }));
        resolve();
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(fullSrc, img);
        setImagesLoaded(prev => ({ ...prev, [index]: true }));
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load image: ${fullSrc}`);
        reject(new Error(`Failed to load image: ${fullSrc}`));
      };
      img.src = fullSrc;
    });
  }, []);
  
  const handleImageLoaded = useCallback((index: number) => {
    setImagesLoaded(prev => ({ ...prev, [index]: true }));
  }, []);
  
  useEffect(() => {
    setImagesLoaded({});
    setActiveIndex(0);
  }, [tours]);

  useEffect(() => {
    if (displayTours.length) {
      const preloadPromises = displayTours.map((tour, index) =>
        preloadImage(tour.image_src, index).catch(() => {
          console.warn(`Image ${index} failed to preload`);
        })
      );
      
      Promise.allSettled(preloadPromises);
    }
  }, [displayTours, preloadImage]);

  useEffect(() => {
    if (!swiper || !autoplay) return;
    
    if (isAutoplayPaused) {
      swiper.autoplay?.stop();
    } else {
      swiper.autoplay?.start();
    }
  }, [swiper, isAutoplayPaused, autoplay]);

  useEffect(() => {
    if (!enableKeyboard || !swiper) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        swiper.slidePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        swiper.slideNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (autoplay) {
          setIsAutoplayPaused(prev => !prev);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, swiper, autoplay]);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover && autoplay) {
      setIsAutoplayPaused(true);
    }
  }, [pauseOnHover, autoplay]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover && autoplay) {
      setIsAutoplayPaused(false);
    }
  }, [pauseOnHover, autoplay]);

  const handleSlideChange = useCallback((swiperInstance: SwiperType) => {
    setActiveIndex(swiperInstance.activeIndex);
  }, []);

  const handleSwiperInit = useCallback((swiperInstance: SwiperType) => {
    setSwiper(swiperInstance);
  }, []);

  if (isPending) {
    return (
      <div className="tour-swiper" style={{ height }}>
        <div className="tour-swiper__loading" role="status" aria-label="Loading tour images">
          <div className="tour-swiper__loading-spinner" />
          <span className="sr-only">Loading tour images...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-swiper" style={{ height }}>
        <div className="tour-swiper__error" role="alert">
          <p>Unable to load tour images</p>
          <button 
            onClick={() => refetch()}
            className="tour-swiper__retry-button"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!displayTours.length) {
    return (
      <div className="tour-swiper" style={{ height }}>
        <div className="tour-swiper__empty" role="status">
          <p>No tour images available</p>
        </div>
      </div>
    );
  }

  const swiperModules = [Pagination, A11y, Navigation, Virtual];
  if (autoplay) swiperModules.push(Autoplay);
  if (effect === 'fade') swiperModules.push(EffectFade);
  if (enableKeyboard) swiperModules.push(Keyboard);

  return (
    <div 
      className="tour-swiper" 
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Tour image gallery"
    >
      <Swiper
        modules={swiperModules}
        slidesPerView={1}
        spaceBetween={0}
        navigation={true}
        pagination={{ 
          clickable: true,
          dynamicBullets: displayTours.length > 5,
          renderBullet: (index: number, className: string) => 
            `<span class="${className}" role="button" aria-label="Go to slide ${index + 1}"></span>`
        }}
        virtual={displayTours.length > 10}
        effect={effect}
        fadeEffect={{
          crossFade: true
        }}
        autoplay={autoplay ? {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: pauseOnHover
        } : false}
        keyboard={{
          enabled: enableKeyboard,
          onlyInViewport: true
        }}
        onSlideChange={handleSlideChange}
        onSwiper={handleSwiperInit}
        className="tour-swiper__container"
        a11y={{
          prevSlideMessage: 'Previous tour image',
          nextSlideMessage: 'Next tour image',
          slideLabelMessage: 'Tour image {{index}} of {{slidesLength}}'
        }}
      >
        {displayTours.map((tour, index) => (
          <SwiperSlide 
            key={`tour-${tour.tourID || index}-${index}`} 
            virtualIndex={index}
            className="tour-swiper__slide"
          >
            {!imagesLoaded[index] && (
              <div className="tour-swiper__slide-loading" aria-hidden="true" />
            )}
            <div 
              className="tour-swiper__slide-image"
              style={{ 
                backgroundImage: `url(http://127.0.0.1:1323${tour.image_src})`,
                opacity: imagesLoaded[index] ? 1 : 0
              }}
              role="img"
              aria-label={tour.title || `Tour image ${index + 1}`}
              onLoad={() => handleImageLoaded(index)}
            />
            <div className="tour-swiper__slide-overlay" aria-hidden="true" />
            {tour.title && (
              <div className="tour-swiper__slide-title">
                <h3>{tour.title}</h3>
                {tour.description && <p>{tour.description}</p>}
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      
      {showCounter && displayTours.length > 1 && (
        <div 
          className="tour-swiper__counter" 
          aria-live="polite"
          aria-label={`Image ${activeIndex + 1} of ${displayTours.length}`}
        >
          {activeIndex + 1} / {displayTours.length}
        </div>
      )}
      
      {showThumbnails && displayTours.length > 1 && (
        <div className="tour-swiper__thumbnails" role="tablist">
          {displayTours.map((image, index) => (
            <button
              key={`thumb-${image.tourID}-${index}`}
              className={`tour-swiper__thumbnail ${activeIndex === index ? 'active' : ''}`}
              onClick={() => swiper?.slideTo(index)}
              role="tab"
              aria-selected={activeIndex === index}
              aria-label={`Show image ${index + 1}`}
              type="button"
            >
              <img
                src={`http://127.0.0.1:1323${image.image_src}`}
                alt={`Tour thumbnail ${index + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
      
      {autoplay && (
        <button
          className={`tour-swiper__play-pause ${isAutoplayPaused ? 'paused' : 'playing'}`}
          onClick={() => setIsAutoplayPaused(prev => !prev)}
          aria-label={isAutoplayPaused ? 'Resume slideshow' : 'Pause slideshow'}
          type="button"
        >
          <span aria-hidden="true">
            {isAutoplayPaused ? '▶️' : '⏸️'}
          </span>
        </button>
      )}
    </div>
  );
};