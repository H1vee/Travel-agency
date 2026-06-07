import {
  API_BASE_URL,
  CarCard,
  CarDetail,
  CarFilters,
  FilterOptions,
  GalleryImage,
  InquiryPayload,
  SearchResponse,
} from '../types/cars';

// Build a query string from the catalogue filters, joining array values with commas.
function buildQuery(filters: CarFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}

class CarService {
  private baseURL = API_BASE_URL;

  getImageUrl(src?: string): string {
    if (!src) return `${this.baseURL}/static/no-image.jpg`;
    if (src.startsWith('http')) return src;
    return `${this.baseURL}${src}`;
  }

  async getCards(): Promise<CarCard[]> {
    return asJson<CarCard[]>(await fetch(`${this.baseURL}/cards`));
  }

  async getSwiper(): Promise<CarCard[]> {
    return asJson<CarCard[]>(await fetch(`${this.baseURL}/carswiper`));
  }

  async getCar(id: number | string): Promise<CarDetail> {
    return asJson<CarDetail>(await fetch(`${this.baseURL}/cars/${id}`));
  }

  async getGallery(id: number | string): Promise<GalleryImage[]> {
    return asJson<GalleryImage[]>(await fetch(`${this.baseURL}/cars/${id}/gallery`));
  }

  async search(filters: CarFilters): Promise<SearchResponse> {
    return asJson<SearchResponse>(await fetch(`${this.baseURL}/search${buildQuery(filters)}`));
  }

  async getFilterOptions(): Promise<FilterOptions> {
    return asJson<FilterOptions>(await fetch(`${this.baseURL}/filter-options`));
  }

  async createInquiry(payload: InquiryPayload): Promise<{ id: number }> {
    return asJson<{ id: number }>(
      await fetch(`${this.baseURL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  }
}

export const carService = new CarService();
