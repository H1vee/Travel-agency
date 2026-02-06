import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Tour, 
  SearchResponse,
  Filters, 
  PriceRange, 
  SortOption,
  DURATIONS, 
  API_BASE_URL 
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

const mapDurationToServerParams = (durationIds: string[]): { minDuration?: number; maxDuration?: number } => {
  if (durationIds.length === 0) return {};
  
  const selectedRanges = durationIds
    .map(id => DURATIONS.find(d => d.id === id))
    .filter((d): d is typeof DURATIONS[0] => d !== undefined);
  
  if (selectedRanges.length === 0) return {};
  
  const globalMin = Math.min(...selectedRanges.map(r => r.min));
  const globalMax = Math.max(...selectedRanges.map(r => r.max));
  
  return { minDuration: globalMin, maxDuration: globalMax };
};

const buildSearchUrl = (
  searchQuery: string, 
  filters: Filters, 
  page: number,
  limit: number,
  sortBy: SortOption
): string => {
  const params = new URLSearchParams();
  
  if (searchQuery.trim()) {
    params.append("title", searchQuery.trim());
  }
  
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    params.append("minPrice", filters.minPrice.toString());
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    params.append("maxPrice", filters.maxPrice.toString());
  }
  
  if (filters.duration && filters.duration.length > 0) {
    const { minDuration, maxDuration } = mapDurationToServerParams(filters.duration);
    if (minDuration !== undefined) {
      params.append("minDuration", minDuration.toString());
    }
    if (maxDuration !== undefined) {
      params.append("maxDuration", maxDuration.toString());
    }
  }
  
  if (filters.rating && filters.rating.length > 0) {
    params.append("ratings", filters.rating.join(","));
  }
  
  if (filters.region && filters.region.length > 0) {
    params.append("region", filters.region.join(","));
  }

  params.append("page", page.toString());
  params.append("limit", limit.toString());
  params.append("sortBy", sortBy);

  return `${API_BASE_URL}/search?${params.toString()}`;
};

export const useSearchTours = (): SearchHookReturn => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const { 
    data: allTours = [], 
    isPending: isLoadingAllTours, 
    error: allToursError,
    refetch: refetchAllTours 
  } = useQuery({
    queryKey: ["allTours"],
    queryFn: async (): Promise<Tour[]> => {
      const response = await fetch(`${API_BASE_URL}/cards`);
      if (!response.ok) {
        throw new Error(`Failed to load tours: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 2,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const hasActiveSearch = useMemo(() => {
    return !!(
      searchQuery.trim() ||
      (filters.minPrice !== undefined && filters.minPrice > 0) ||
      (filters.maxPrice !== undefined && filters.maxPrice > 0) ||
      (filters.duration && filters.duration.length > 0) ||
      (filters.rating && filters.rating.length > 0) ||
      (filters.region && filters.region.length > 0)
    );
  }, [searchQuery, filters]);

  const searchUrl = useMemo(() => {
    if (!hasActiveSearch) return null;
    return buildSearchUrl(searchQuery, filters, currentPage, itemsPerPage, sortBy);
  }, [searchQuery, filters, hasActiveSearch, currentPage, itemsPerPage, sortBy]);

  const { 
    data: searchResponse, 
    isPending: isSearching,
    error: searchQueryError
  } = useQuery({
    queryKey: ["searchTours", searchUrl],
    queryFn: async (): Promise<SearchResponse> => {
      if (!searchUrl) {
        return { 
          tours: [], 
          total: 0, 
          page: 1, 
          limit: itemsPerPage, 
          totalPages: 0, 
          appliedFilters: {} 
        };
      }
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.tours || !Array.isArray(data.tours)) {
        return { 
          tours: [], 
          total: 0, 
          page: 1, 
          limit: itemsPerPage, 
          totalPages: 0, 
          appliedFilters: {} 
        };
      }
      
      return data as SearchResponse;
    },
    enabled: !!searchUrl && hasActiveSearch,
    retry: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const searchResults = useMemo(() => {
    if (!searchResponse?.tours) return [];
    
    console.log('Search response tours:', searchResponse.tours);

    return searchResponse.tours.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      rating: item.rating,
      imageSrc: item.imageSrc,
      description: '',
      location: item.location || '',
      duration: item.duration ? `${item.duration} днів` : '',
      participants: 0,
      isPopular: item.rating >= 4.5,
      discount: 0
    }));
  }, [searchResponse]);

  const updateSearch = useCallback((newQuery: string, newFilters: Filters) => {
    setSearchQuery(newQuery);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const currentTours = useMemo((): Tour[] => {
    return hasActiveSearch ? searchResults : allTours;
  }, [hasActiveSearch, searchResults, allTours]);

  const priceRange = useMemo(() => {
    if (!allTours.length) return { min: 0, max: 100000 };
    
    const prices = allTours
      .map(tour => tour.price || 0)
      .filter(price => price > 0);
    
    if (prices.length === 0) return { min: 0, max: 100000 };
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const maxWithBuffer = Math.ceil(max * 1.2);
    
    return { min: 0, max: maxWithBuffer };
  }, [allTours]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setFilters({});
    setCurrentPage(1);
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSetSortBy = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  const handleSetItemsPerPage = useCallback((count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  }, []);

  const combinedError = allToursError || searchQueryError;

  return {
    allTours,
    searchResults,
    currentTours,
    priceRange,
    searchQuery,
    filters,
    hasActiveSearch,
    currentPage,
    totalResults: searchResponse?.total,
    totalPages: searchResponse?.totalPages,
    isLoadingAllTours,
    isSearching,
    error: combinedError as Error | null,
    updateSearch,
    clearSearch,
    refetchAllTours,
    setPage,
    setSortBy: handleSetSortBy,
    setItemsPerPage: handleSetItemsPerPage,
  };
};