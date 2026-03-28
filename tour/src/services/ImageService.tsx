interface ImageCache {
  [key: string]: {
    url: string;
    timestamp: number;
    hits: number;
  };
}

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
}

class ImageService {
  private cache: ImageCache = {};
  private baseURL = process.env.REACT_APP_API_URL!;
  private loadingImages = new Map<string, Promise<string>>();
  private maxCacheSize = 200; // Максимальна кількість зображень в кеші
  private cacheExpiryTime = 30 * 60 * 1000; // 30 хвилин

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Отримати URL зображення з автоматичною обробкою різних форматів
   */
  getImageUrl(imageSrc: string | null | undefined): string {
    if (!imageSrc) return '/static/images/no-image.jpg';
    
    // Якщо це вже повний URL
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }

    // Якщо це шлях до статики на сервері
    if (imageSrc.startsWith('/static/')) {
      return `${this.baseURL}${imageSrc}`;
    }

    // Інакше будуємо шлях
    const cleanPath = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
    return `${this.baseURL}/static/images${cleanPath}`;
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Предзавантажити зображення з можливістю встановлення пріоритету
   */
  async preloadImage(
    imageSrc: string | null | undefined, 
    options: PreloadOptions = {}
  ): Promise<string> {
    const { priority = 'medium', timeout = 10000 } = options;
    const url = this.getImageUrl(imageSrc);

    // Перевіряємо кеш
    if (this.cache[url]) {
      // Оновлюємо статистику використання
      this.cache[url].hits++;
      this.cache[url].timestamp = Date.now();
      return this.cache[url].url;
    }

    // Якщо зображення вже завантажується - повертаємо існуючий Promise
    if (this.loadingImages.has(url)) {
      return this.loadingImages.get(url)!;
    }
    
    // Створюємо новий Promise для завантаження
    const loadPromise = new Promise<string>((resolve, reject) => {
      const img = new Image();
      
      // Таймаут для завантаження
      const timeoutId = setTimeout(() => {
        this.loadingImages.delete(url);
        console.warn(`Image loading timeout: ${url}`);
        resolve(this.getImageUrl(null));
      }, timeout);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        
        // Додаємо в кеш
        this.addToCache(url);
        
        this.loadingImages.delete(url);
        resolve(url);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        this.loadingImages.delete(url);
        console.error(`Failed to load image: ${url}`);
        resolve(this.getImageUrl(null));
      };

      // Встановлюємо CORS та пріоритет
      img.crossOrigin = 'anonymous';
      
      // 🚀 ОПТИМІЗАЦІЯ: Використовуємо fetchpriority API
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }
      
      img.src = url;
    });

    this.loadingImages.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Batch завантаження зображень з контролем паралелізму
   */
  async preloadImages(
    imageSources: (string | null | undefined)[],
    options: PreloadOptions & { concurrency?: number } = {}
  ): Promise<void> {
    const { concurrency = 6, ...preloadOptions } = options;
    
    const validSources = imageSources.filter(src => src != null && src !== '');
    if (validSources.length === 0) return;

    // 🚀 ОПТИМІЗАЦІЯ: Завантажуємо партіями для контролю навантаження
    const batches: string[][] = [];
    for (let i = 0; i < validSources.length; i += concurrency) {
      batches.push(validSources.slice(i, i + concurrency) as string[]);
    }

    for (const batch of batches) {
      const promises = batch.map(src => 
        this.preloadImage(src, preloadOptions).catch(err => {
          console.warn(`Failed to preload ${src}:`, err);
          return null;
        })
      );
      
      await Promise.all(promises);
    }
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Додати зображення в кеш з LRU стратегією
   */
  private addToCache(url: string): void {
    // Якщо кеш переповнений - видаляємо найменш використовувані
    if (Object.keys(this.cache).length >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache[url] = {
      url,
      timestamp: Date.now(),
      hits: 1
    };
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Видалити найменш використовувані зображення (LRU)
   */
  private evictLeastUsed(): void {
    const entries = Object.entries(this.cache);
    
    // Сортуємо за кількістю використань та часом
    entries.sort((a, b) => {
      const scoreA = a[1].hits / (Date.now() - a[1].timestamp);
      const scoreB = b[1].hits / (Date.now() - b[1].timestamp);
      return scoreA - scoreB;
    });

    // Видаляємо 20% найменш використовуваних
    const toRemove = Math.floor(this.maxCacheSize * 0.2);
    entries.slice(0, toRemove).forEach(([url]) => {
      delete this.cache[url];
    });
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Очистити застарілий кеш
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    Object.entries(this.cache).forEach(([url, data]) => {
      if (now - data.timestamp > this.cacheExpiryTime) {
        delete this.cache[url];
      }
    });
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Prefetch зображень які будуть потрібні незабаром
   */
  async prefetchNextPage(imageSources: (string | null | undefined)[]): Promise<void> {
    // Завантажуємо з низьким пріоритетом
    await this.preloadImages(imageSources, { 
      priority: 'low',
      concurrency: 3 
    });
  }

  /**
   * Очистити весь кеш
   */
  clearCache(): void {
    this.cache = {};
    this.loadingImages.clear();
  }

  /**
   * Отримати розмір кешу
   */
  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
  
  /**
   * Перевірити чи зображення в кеші
   */
  isCached(imageSrc: string): boolean {
    const url = this.getImageUrl(imageSrc);
    return !!this.cache[url];
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Отримати статистику кешу
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    topImages: Array<{ url: string; hits: number }>;
  } {
    const entries = Object.entries(this.cache);
    const totalHits = entries.reduce((sum, [, data]) => sum + data.hits, 0);
    
    const topImages = entries
      .sort((a, b) => b[1].hits - a[1].hits)
      .slice(0, 10)
      .map(([url, data]) => ({ url, hits: data.hits }));

    return {
      size: entries.length,
      maxSize: this.maxCacheSize,
      hitRate: totalHits / Math.max(entries.length, 1),
      topImages
    };
  }

  /**
   * 🚀 ОПТИМІЗАЦІЯ: Встановити максимальний розмір кешу
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    
    // Якщо поточний розмір більший - видаляємо зайве
    if (Object.keys(this.cache).length > size) {
      while (Object.keys(this.cache).length > size) {
        this.evictLeastUsed();
      }
    }
  }
}

// Створюємо singleton instance
export const imageService = new ImageService();

// 🚀 ОПТИМІЗАЦІЯ: Періодично очищаємо застарілий кеш
if (typeof window !== 'undefined') {
  setInterval(() => {
    imageService.cleanExpiredCache();
  }, 5 * 60 * 1000); // Кожні 5 хвилин
}

// 🚀 ОПТИМІЗАЦІЯ: Експортуємо також клас для можливості створення окремих інстансів
export { ImageService };