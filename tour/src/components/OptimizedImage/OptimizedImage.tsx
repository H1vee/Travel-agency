import React, { useState, useEffect, useRef } from 'react';
import { imageService } from '../../services/ImageService';
import './OptimizedImage.scss';

export interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  placeholder?: React.ReactNode;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  loading = 'lazy',
  placeholder,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Якщо немає src - показуємо помилку
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (loading === 'lazy') {
      // Використовуємо Intersection Observer для lazy loading
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observerRef.current?.disconnect();
            }
          });
        },
        { 
          rootMargin: '100px', // Починаємо завантажувати за 100px до появи
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }

      return () => {
        observerRef.current?.disconnect();
      };
    } else {
      // Eager loading - завантажуємо відразу
      loadImage();
    }
  }, [src, loading]);

  const loadImage = async () => {
    if (!src) return;

    try {
      setIsLoading(true);
      setHasError(false);
      const url = await imageService.preloadImage(src);
      setImageUrl(url);
      setIsLoading(false);
      onLoad?.();
    } catch (error) {
      console.error('Image load error:', error);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  // Стан помилки
  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`optimized-image optimized-image--error ${className}`}
      >
        <div className="optimized-image__error-content">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>Зображення недоступне</span>
        </div>
      </div>
    );
  }

  // Стан завантаження
  if (isLoading) {
    return (
      <div 
        ref={imgRef}
        className={`optimized-image optimized-image--loading ${className}`}
      >
        {placeholder || (
          <div className="optimized-image__skeleton">
            <div className="optimized-image__skeleton-shimmer" />
          </div>
        )}
      </div>
    );
  }

  // Завантажене зображення
  return (
    <img
      ref={imgRef}
      src={imageUrl}
      alt={alt}
      className={`optimized-image optimized-image--loaded ${className}`}
      loading={loading}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
};