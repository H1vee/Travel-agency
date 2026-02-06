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
  duration?: number;
  location?: string;
  region?: string;
}

export interface SearchFilters {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  regions?: string[];
  ratings?: string[];
}

export interface SearchResponse {
  tours: SearchTourResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appliedFilters: SearchFilters;
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

export type SortOption = 'price_asc' | 'price_desc' | 'rating_desc' | 'popular' | 'newest' | 'title_asc';
export type ViewMode = 'grid' | 'list';

export const DURATIONS = [
  { id: "1", name: "1-3 дні", min: 1, max: 3 },
  { id: "2", name: "4-7 днів", min: 4, max: 7 },
  { id: "3", name: "8-14 днів", min: 8, max: 14 },
  { id: "4", name: "15+ днів", min: 15, max: 30 }
];

export const REGIONS = [
  { id: "1", name: "Україна" },
  { id: "2", name: "Європа" },
  { id: "3", name: "Азія" },
  { id: "4", name: "Америка" },
  { id: "5", name: "Близький Схід" },
  { id: "6", name: "Океанія" }
];

export const RATINGS = [
  { id: "5", stars: 5, label: "5 зірок", min: 5.0, max: 5.0 },
  { id: "4", stars: 4, label: "4-4.9 зірки", min: 4.0, max: 4.99 },
  { id: "3", stars: 3, label: "3-3.9 зірки", min: 3.0, max: 3.99 },
  { id: "2", stars: 2, label: "2-2.9 зірки", min: 2.0, max: 2.99 },
  { id: "1", stars: 1, label: "1-1.9 зірка", min: 1.0, max: 1.99 }
];

export const API_BASE_URL = "http://127.0.0.1:1323";