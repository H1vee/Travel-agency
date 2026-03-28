import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Tour, SearchResponse, Filters, PriceRange, SortOption,
  DURATIONS, API_BASE_URL
} from '../types/tours';

interface SearchHookReturn {
  allTours: Tour[];
  searchResults: Tour[];
  currentTours: Tour[];
  priceRange: PriceRange;
  searchQuery: string;
  filters: Filters;
  hasActiveSearch: boolean;
  currentPage: number;
  totalResults?: number;
  totalPages?: number;
  isLoadingAllTours: boolean;
  isSearching: boolean;
  error: Error | null;
  updateSearch: (query: string, filters: Filters) => void;
  clearSearch: () => void;
  refetchAllTours: () => void;
  setPage: (page: number) => void;
  setSortBy: (sortBy: SortOption) => void;
  setItemsPerPage: (count: number) => void;
}

const mapDurationToServerParams = (durationIds: string[]) => {
  if (!durationIds.length) return {};
  const selected = durationIds.map(id => DURATIONS.find(d => d.id === id)).filter(Boolean) as typeof DURATIONS;
  if (!selected.length) return {};
  return {
    minDuration: Math.min(...selected.map(r => r.min)),
    maxDuration: Math.max(...selected.map(r => r.max)),
  };
};

const buildSearchUrl = (
  searchQuery: string,
  filters: Filters,
  page: number,
  limit: number,
  sortBy: SortOption
): string => {
  const p = new URLSearchParams();
  if (searchQuery.trim()) p.append('title', searchQuery.trim());
  if (filters.minPrice !== undefined && filters.minPrice > 0) p.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) p.append('maxPrice', filters.maxPrice.toString());
  if (filters.duration?.length) {
    const { minDuration, maxDuration } = mapDurationToServerParams(filters.duration);
    if (minDuration !== undefined) p.append('minDuration', minDuration.toString());
    if (maxDuration !== undefined) p.append('maxDuration', maxDuration.toString());
  }
  if (filters.rating?.length) p.append('ratings', filters.rating.join(','));
  if (filters.region?.length) p.append('region', filters.region.join(','));
  p.append('page', page.toString());
  p.append('limit', limit.toString());
  p.append('sortBy', sortBy);
  return `${API_BASE_URL}/search?${p.toString()}`;
};

export const useSearchTours = (): SearchHookReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortByState] = useState<SortOption>('popular');

  // Always use /search — it handles both filtered and unfiltered requests
  const searchUrl = useMemo(
    () => buildSearchUrl(searchQuery, filters, currentPage, itemsPerPage, sortBy),
    [searchQuery, filters, currentPage, itemsPerPage, sortBy]
  );

  const { data: searchResponse, isPending: isSearching, error: searchError, refetch } = useQuery({
    queryKey: ['searchTours', searchUrl],
    queryFn: async (): Promise<SearchResponse> => {
      const res = await fetch(searchUrl);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();
      if (!data.tours || !Array.isArray(data.tours)) {
        return { tours: [], total: 0, page: 1, limit: itemsPerPage, totalPages: 0, appliedFilters: {} };
      }
      return data as SearchResponse;
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const currentTours: Tour[] = useMemo(() => {
    if (!searchResponse?.tours) return [];
    return searchResponse.tours.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      rating: typeof item.rating === 'number' ? item.rating : 0,
      imageSrc: item.image_src || item.imageSrc || '',
      description: '',
      location: item.location || '',
      duration: item.duration ? `${item.duration} днів` : '',
      isPopular: (item.rating ?? 0) >= 4.5,
      discount: 0,
    }));
  }, [searchResponse]);

  // priceRange — fetch once from /cards to get min/max prices
  const { data: allToursRaw = [], isPending: isLoadingAllTours } = useQuery({
    queryKey: ['allTours'],
    queryFn: async (): Promise<Tour[]> => {
      const res = await fetch(`${API_BASE_URL}/cards`);
      if (!res.ok) throw new Error(`Failed to load tours: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        rating: typeof item.rating === 'number' ? item.rating : 0,
        imageSrc: item.imageSrc || item.image_src || '',
        description: '',
        location: '',
        duration: '',
        isPopular: false,
        discount: 0,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  const priceRange = useMemo(() => {
    if (!allToursRaw.length) return { min: 0, max: 100000 };
    const prices = allToursRaw.map(t => t.price || 0).filter(p => p > 0);
    if (!prices.length) return { min: 0, max: 100000 };
    return { min: 0, max: Math.ceil(Math.max(...prices) * 1.1) };
  }, [allToursRaw]);

  const hasActiveSearch = useMemo(() => !!(
    searchQuery.trim() ||
    (filters.minPrice !== undefined && filters.minPrice > 0) ||
    (filters.maxPrice !== undefined && filters.maxPrice > 0) ||
    filters.duration?.length ||
    filters.rating?.length ||
    filters.region?.length
  ), [searchQuery, filters]);

  const updateSearch = useCallback((newQuery: string, newFilters: Filters) => {
    setSearchQuery(newQuery);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({});
    setCurrentPage(1);
  }, []);

  const setPage = useCallback((page: number) => setCurrentPage(page), []);

  const setSortBy = useCallback((s: SortOption) => {
    setSortByState(s);
    setCurrentPage(1);
  }, []);

  const handleSetItemsPerPage = useCallback((count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  }, []);

  return {
    allTours: allToursRaw,
    searchResults: currentTours,
    currentTours,
    priceRange,
    searchQuery,
    filters,
    hasActiveSearch,
    currentPage,
    totalResults: searchResponse?.total,
    totalPages: searchResponse?.totalPages,
    isLoadingAllTours: isLoadingAllTours && !searchResponse,
    isSearching,
    error: searchError as Error | null,
    updateSearch,
    clearSearch,
    refetchAllTours: refetch,
    setPage,
    setSortBy,
    setItemsPerPage: handleSetItemsPerPage,
  };
};