export interface Tour {
  id: number;
  title: string;
  description?: string;
  price: number;
  imageSrc: string;
  region?: string;
  duration?: string;
  rating?: number;
  participants?: number;
  location?: string;
  isPopular?: boolean;
  discount?: number;
}

export interface SearchResult {
  id: number;
}

export interface SearchTourResult {
  id: number;
  title: string;
  price: number;
  rating: number;
  imageSrc: string;
}

export interface Filters {
  minPrice?: number;
  maxPrice?: number;
  duration?: string[];
  rating?: string[];
  region?: string[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'popular' | 'newest';
export type ViewMode = 'grid' | 'list';

export const DURATION_MAP: Record<string, number> = {
  "1": 3,
  "2": 7,
  "3": 14,
  "4": 30,
};

export const REGIONS = [
  { id: "1", name: "Україна" },
  { id: "2", name: "Європа" },
  { id: "3", name: "Азія" },
  { id: "4", name: "Америка" },
  { id: "5", name: "Близький Схід" },
  { id: "6", name: "Океанія" }
];

export const DURATIONS = [
  { id: "1", name: "1-3 дні" },
  { id: "2", name: "4-7 днів" },
  { id: "3", name: "8-14 днів" },
  { id: "4", name: "15+ днів" }
];

export const RATINGS = [
  { id: "5", stars: 5, label: "5 зірок" },
  { id: "4", stars: 4, label: "4+ зірки" },
  { id: "3", stars: 3, label: "3+ зірки" },
  { id: "2", stars: 2, label: "2+ зірки" },
  { id: "1", stars: 1, label: "1+ зірка" }
];

export const API_BASE_URL = "http://127.0.0.1:1323";
