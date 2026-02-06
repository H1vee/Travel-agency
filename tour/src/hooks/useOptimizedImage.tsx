import { useState, useEffect, useRef, useCallback } from 'react';
import { imageService } from '../services/ImageService';

interface UseOptimizedImageOptions {
  priority?: 'high' | 'medium' | 'low';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

interface UseOptimizedImageReturn {
  imageUrl: string;
  isLoading: boolean;
  hasError: boolean;
  isCached: boolean;
  reload: () => void;
}

/**
 * 🚀 ОПТИМІЗОВАНИЙ ХУК: Використання зображень з автоматичним кешуванням
 */
export const useOptimizedImage = (
  src: string | null | undefined,
  options: UseOptimizedImageOptions = {}
): UseOptimizedImageReturn => {
  const {
    priority = 'medium',
    loading = 'lazy',
    onLoad,
    onError
  } = options;

  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCached, setIsCached] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadImage = useCallback(async () => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Скасовуємо попереднє завантаження якщо воно є
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setHasError(false);
      
      // Перевіряємо чи зображення вже в кеші
      const cached = imageService.isCached(src);
      setIsCached(cached);
      
      // Завантажуємо зображення
      const url = await imageService.preloadImage(src, { 
        priority: cached ? 'low' : priority 
      });
      
      setImageUrl(url);
      setIsLoading(false);
      setIsCached(true);
      onLoad?.();
    } catch (error) {
      console.error('Image load error:', error);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  }, [src, priority, onLoad, onError]);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (loading === 'lazy') {
      // 🚀 ОПТИМІЗАЦІЯ: Використовуємо Intersection Observer для lazy loading
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

      // Зберігаємо референс на елемент
      if (elementRef.current) {
        observerRef.current.observe(elementRef.current);
      }

      return () => {
        observerRef.current?.disconnect();
        abortControllerRef.current?.abort();
      };
    } else {
      // Eager loading - завантажуємо відразу
      loadImage();
      
      return () => {
        abortControllerRef.current?.abort();
      };
    }
  }, [src, loading, loadImage]);

  const reload = useCallback(() => {
    loadImage();
  }, [loadImage]);

  return {
    imageUrl,
    isLoading,
    hasError,
    isCached,
    reload
  };
};

/**
 * 🚀 ОПТИМІЗОВАНИЙ ХУК: Batch предзавантаження зображень
 */
export const useBatchImagePreload = (
  imageSources: (string | null | undefined)[],
  options: { priority?: 'high' | 'medium' | 'low'; concurrency?: number } = {}
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const validSources = imageSources.filter(src => src != null && src !== '');
    
    if (validSources.length === 0) {
      setIsLoading(false);
      setLoadedCount(0);
      return;
    }

    setIsLoading(true);
    setLoadedCount(0);
    setError(null);

    const loadImages = async () => {
      try {
        await imageService.preloadImages(validSources, options);
        setLoadedCount(validSources.length);
        setIsLoading(false);
      } catch (err) {
        console.error('Batch image preload error:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadImages();
  }, [JSON.stringify(imageSources), options.priority, options.concurrency]);

  const validCount = imageSources.filter(src => src != null && src !== '').length;

  return {
    isLoading,
    loadedCount,
    totalCount: validCount,
    progress: validCount > 0 ? (loadedCount / validCount) * 100 : 0,
    error,
  };
};

/**
 * 🚀 ОПТИМІЗОВАНИЙ ХУК: Prefetch наступної сторінки зображень
 */
export const usePrefetchImages = (
  imageSources: (string | null | undefined)[],
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled || imageSources.length === 0) return;

    // Невелика затримка перед prefetch щоб не заважати основному завантаженню
    const timeoutId = setTimeout(() => {
      imageService.prefetchNextPage(imageSources);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [imageSources, enabled]);
};

/**
 * 🚀 ОПТИМІЗОВАНИЙ ХУК: Моніторинг статистики кешу (для debug)
 */
export const useImageCacheStats = () => {
  const [stats, setStats] = useState(imageService.getCacheStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(imageService.getCacheStats());
    }, 5000); // Оновлюємо кожні 5 секунд

    return () => clearInterval(interval);
  }, []);

  return stats;
};