import { useState, useEffect } from 'react';
import { imageService } from '../services/ImageService';

interface UseImagePreloadReturn {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  progress: number;
  error: Error | null;
}


export const useImagePreload = (
  imageSources: (string | null | undefined)[]
): UseImagePreloadReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Фільтруємо null/undefined
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
      let count = 0;
      const errors: Error[] = [];

      // Завантажуємо послідовно для контролю прогресу
      for (const src of validSources) {
        try {
          await imageService.preloadImage(src as string);
          count++;
          setLoadedCount(count);
        } catch (err) {
          console.warn(`Failed to preload ${src}:`, err);
          errors.push(err as Error);
          count++;
          setLoadedCount(count);
        }
      }

      setIsLoading(false);
      
      if (errors.length === validSources.length) {
        setError(new Error('Failed to load all images'));
      }
    };

    loadImages();
  }, [JSON.stringify(imageSources)]); // Залежність від масиву

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
 * Хук для предзавантаження одного зображення
 */
export const useImagePreloadSingle = (imageSrc: string | null | undefined) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setIsLoaded(false);
      return;
    }

    setIsLoaded(false);
    setError(null);

    imageService
      .preloadImage(imageSrc)
      .then(() => setIsLoaded(true))
      .catch((err) => {
        console.error('Failed to preload image:', err);
        setError(err);
        setIsLoaded(false);
      });
  }, [imageSrc]);

  return { isLoaded, error };
};