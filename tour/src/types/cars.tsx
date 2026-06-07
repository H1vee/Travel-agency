export const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Compact representation used in catalogue grids and the home swiper.
export interface CarCard {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  bodyType: string;
  imageSrc: string;
}

// Full representation used on a car's detail page.
export interface CarDetail {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  price: number;
  mileage: number;
  fuelType: string;
  engine: string;
  engineCapacity: number | null;
  batteryCapacity: number | null;
  transmission: string;
  drive: string;
  bodyType: string;
  color: string;
  seats: number;
  description: string;
  statusId: number;
  status: string;
  cardImage: string;
}

export interface GalleryImage {
  id: number;
  imageSrc: string;
}

export interface SearchResponse {
  cars: CarCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  drives: string[];
  transmissions: string[];
  seats: number[];
  minPrice: number;
  maxPrice: number;
  minYear: number;
  maxYear: number;
  minMileage: number;
  maxMileage: number;
}

// Catalogue search filters, mirror of the backend query params.
export interface CarFilters {
  q?: string;
  make?: string[];
  bodyType?: string[];
  fuelType?: string[];
  drive?: string[];
  transmission?: string[];
  seats?: string[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  minEngine?: number;
  maxEngine?: number;
  minBattery?: number;
  maxBattery?: number;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

export type SortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'year_desc'
  | 'year_asc'
  | 'mileage_asc';

export type RequestType = 'turnkey_quote' | 'renovation_cost' | 'question';

export interface InquiryPayload {
  carId?: number;
  requestType: RequestType;
  contactMethod: string;
  phone: string;
  name?: string;
  message?: string;
}

// ---- Ukrainian display labels -------------------------------------------

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  turnkey_quote: 'Розрахувати ціну під ключ',
  renovation_cost: 'Розрахувати вартість відновлення',
  question: 'Поставити запитання',
};

export const FUEL_LABELS: Record<string, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  electric: 'Електро',
  hybrid: 'Гібрид',
  gas: 'Газ',
};

export const TRANSMISSION_LABELS: Record<string, string> = {
  manual: 'Механічна',
  automatic: 'Автоматична',
  robot: 'Робот',
  cvt: 'Варіатор',
};

export const DRIVE_LABELS: Record<string, string> = {
  front: 'Передній',
  rear: 'Задній',
  all: 'Повний',
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Спочатку нові',
  price_asc: 'Ціна: за зростанням',
  price_desc: 'Ціна: за спаданням',
  year_desc: 'Рік: новіші',
  year_asc: 'Рік: старіші',
  mileage_asc: 'Пробіг: менший',
};

export const label = (map: Record<string, string>, key: string): string =>
  map[key] || key || '—';
