import React, { useRef, useEffect } from 'react';
import { useOptimizedImage } from '../../hooks/useOptimizedImage';
import './OptimizedImage.scss';

export interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  priority?: 'high' | 'medium' | 'low';
  placeholder?: React.ReactNode;
  showLoadingIndicator?: boolean;
}

/**
 * 🚀 ОПТИМІЗОВАНИЙ КОМПОНЕНТ: Зображення з автоматичним кешуванням та lazy loading
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  loading = 'lazy',
  priority = 'medium',
  placeholder,
  showLoadingIndicator = true,
}) => {
  const imgRef = useRef<HTMLDivElement>(null);
  
  const { 
    imageUrl, 
    isLoading, 
    hasError, 
    isCached,
    reload 
  } = useOptimizedImage(src, {
    priority,
    loading,
    onLoad,
    onError
  });

  // 🚀 ОПТИМІЗАЦІЯ: Додаємо підказку браузеру про важливість зображення
  useEffect(() => {
    if (priority === 'high' && imgRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrl;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [imageUrl, priority]);

  // Стан помилки
  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`optimized-image optimized-image--error ${className}`}
        onClick={reload}
        role="button"
        tabIndex={0}
        aria-label="Перезавантажити зображення"
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
          <small>Клікніть для перезавантаження</small>
        </div>
      </div>
    );
  }

  // Стан завантаження
  if (isLoading && showLoadingIndicator) {
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

  // 🚀 ОПТИМІЗАЦІЯ: Завантажене зображення
  return (
    <img
      ref={imgRef as any}
      src={imageUrl}
      alt={alt}
      className={`optimized-image optimized-image--loaded ${isCached ? 'optimized-image--cached' : ''} ${className}`}
      loading={loading}
      // 🚀 ОПТИМІЗАЦІЯ: Додаємо декодування для кращої продуктивності
      decoding={priority === 'high' ? 'sync' : 'async'}
      // 🚀 ОПТИМІЗАЦІЯ: Використовуємо fetchpriority API
      {...(priority === 'high' && { fetchpriority: 'high' } as any)}
      onError={() => {
        onError?.();
      }}
    />
  );
};

/**
 * 🚀 ОПТИМІЗОВАНИЙ КОМПОНЕНТ: Background Image з кешуванням
 */
export const OptimizedBackgroundImage: React.FC<{
  src: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  priority?: 'high' | 'medium' | 'low';
}> = ({ 
  src, 
  className = '', 
  children,
  loading = 'lazy',
  priority = 'medium'
}) => {
  const { imageUrl, isLoading } = useOptimizedImage(src, { priority, loading });

  return (
    <div 
      className={`optimized-bg-image ${isLoading ? 'optimized-bg-image--loading' : ''} ${className}`}
      style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
    >
      {children}
    </div>
  );
};