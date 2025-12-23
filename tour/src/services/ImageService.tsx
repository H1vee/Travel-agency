interface ImageCache {
  [key: string]: string;
}

class ImageService {
  private cache: ImageCache = {};
  private baseURL = 'http://127.0.0.1:1323';
  private loadingImages = new Set<string>();


  getImageUrl(imageSrc: string | null | undefined): string {
    if (!imageSrc) return '/static/images/no-image.jpg';
    
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }

    if (imageSrc.startsWith('/static/')) {
      return `${this.baseURL}${imageSrc}`;
    }

    const cleanPath = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
    return `${this.baseURL}/static/images${cleanPath}`;
  }

  async preloadImage(imageSrc: string | null | undefined): Promise<string> {
    const url = this.getImageUrl(imageSrc);

    if (this.cache[url]) {
      return this.cache[url];
    }

    if (this.loadingImages.has(url)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache[url]) {
            clearInterval(checkInterval);
            resolve(this.cache[url]);
          }
        }, 50);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(url);
        }, 10000);
      });
    }
    
    this.loadingImages.add(url);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache[url] = url;
        this.loadingImages.delete(url);
        resolve(url);
      };
      
      img.onerror = () => {
        this.loadingImages.delete(url);
        console.error(`Failed to load image: ${url}`);
        resolve(this.getImageUrl(null));
      };

      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  async preloadImages(imageSources: (string | null | undefined)[]): Promise<void> {
    const promises = imageSources
      .filter(src => src != null)
      .map(src => 
        this.preloadImage(src).catch(err => {
          console.warn(`Failed to preload ${src}:`, err);
          return null;
        })
      );
    
    await Promise.all(promises);
  }

  clearCache(): void {
    this.cache = {};
    this.loadingImages.clear();
  }

  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
  
  isCached(imageSrc: string): boolean {
    const url = this.getImageUrl(imageSrc);
    return !!this.cache[url];
  }
}

export const imageService = new ImageService();