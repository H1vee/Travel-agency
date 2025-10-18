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

const mapDurationToServerParams = (durationIds: string[]): { minDuration?: string; maxDuration?: string } => {
  if (durationIds.length === 0) return {};
  
  const selectedRanges = durationIds.map(id => {
    const duration = DURATIONS.find(d => d.id === id);
    return duration ? { min: duration.min, max: duration.max } : null;
  }).filter(Boolean);
  
  if (selectedRanges.length === 0) return {};
  
  const globalMin = Math.min(...selectedRanges.map(r => r!.min));
  const globalMax = Math.max(...selectedRanges.map(r => r!.max));
  
  console.log("🕒 Duration mapping:", { 
    durationIds, 
    selectedRanges, 
    globalMin, 
    globalMax 
  });
  
  return {
    minDuration: globalMin.toString(),
    maxDuration: globalMax.toString()
  };
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
    params.append("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    params.append("maxPrice", String(filters.maxPrice));
  }
  
  if (filters.duration && filters.duration.length > 0) {
    const durationParams = mapDurationToServerParams(filters.duration);
    if (durationParams.minDuration) {
      params.append("minDuration", durationParams.minDuration);
    }
    if (durationParams.maxDuration) {
      params.append("maxDuration", durationParams.maxDuration);
    }
  }
  
  if (filters.rating && filters.rating.length > 0) {
    const minRating = Math.min(...filters.rating.map(r => parseInt(r)));
    params.append("minRating", String(minRating));
  }
  
  if (filters.region && filters.region.length > 0) {
    params.append("region", filters.region.join(","));
  }

  params.append("page", String(page));
  params.append("limit", String(limit));
  params.append("sortBy", sortBy);

  const url = `${API_BASE_URL}/search?${params.toString()}`;
  console.log("🔗 Search URL:", url);
  return url;
};

export const useSearchTours = (): SearchHookReturn => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchError, setSearchError] = useState<string | null>(null);

  const { 
    data: allTours = [], 
    isPending: isLoadingAllTours, 
    error: allToursError,
    refetch: refetchAllTours 
  } = useQuery({
    queryKey: ["allTours"],
    queryFn: async (): Promise<Tour[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/cards`);
        if (!response.ok) {
          throw new Error(`Помилка завантаження турів: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Помилка завантаження всіх турів:", error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, 
    gcTime: 15 * 60 * 1000, 
  });

  const hasActiveSearch = useMemo(() => {
    return !!(
      searchQuery.trim() ||
      (filters.minPrice !== undefined && filters.minPrice > 0) ||
      (filters.maxPrice !== undefined) ||
      (filters.duration && filters.duration.length > 0) ||
      (filters.rating && filters.rating.length > 0) ||
      (filters.region && filters.region.length > 0)
    );
  }, [searchQuery, filters]);

  const searchUrl = useMemo(() => {
    return hasActiveSearch ? buildSearchUrl(searchQuery, filters, currentPage, itemsPerPage, sortBy) : null;
  }, [searchQuery, filters, hasActiveSearch, currentPage, itemsPerPage, sortBy]);

  const { 
    data: searchResponse, 
    isPending: isSearching,
    error: searchQueryError
  } = useQuery({
    queryKey: ["searchTours", searchUrl],
    queryFn: async (): Promise<SearchResponse> => {
      if (!searchUrl) return { tours: [], total: 0, page: 1, limit: itemsPerPage, totalPages: 0, appliedFilters: {} };
      
      try {
        console.log("🔍 Виконуємо пошук:", searchUrl);
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Помилка пошуку: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("🔍 Результати пошуку:", data.tours?.length || 0, "з", data.total || 0, "турів");
        
        // Переконуємося що дані корректні
        if (!data.tours || !Array.isArray(data.tours)) {
          console.warn("Некоректний формат даних з сервера:", data);
          return { tours: [], total: 0, page: 1, limit: itemsPerPage, totalPages: 0, appliedFilters: {} };
        }
        
        return data as SearchResponse;
      } catch (error) {
        console.error("❌ Помилка пошуку:", error);
        throw error;
      }
    },
    enabled: !!searchUrl && hasActiveSearch,
    retry: 1,
    staleTime: 2 * 60 * 1000, 
    gcTime: 5 * 60 * 1000,    
  });

  const searchResults = useMemo(() => {
    if (!searchResponse?.tours) return [];
    
    console.log("🔄 Обробка результатів пошуку:", searchResponse.tours.length, "турів");
    
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
    console.log("🔄 Update search:", { newQuery, newFilters });
    setSearchQuery(newQuery);
    setFilters(newFilters);
    setCurrentPage(1);
    setSearchError(null);
  }, []);

  const getCurrentTours = useCallback((): Tour[] => {
    const tours = hasActiveSearch ? searchResults : allTours;
    console.log("📊 Current tours:", tours.length, "hasActiveSearch:", hasActiveSearch);
    return tours;
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
    console.log("🧹 Clear search");
    setSearchQuery("");
    setFilters({});
    setCurrentPage(1);
    setSearchError(null);
  }, []);

  const setPage = useCallback((page: number) => {
    console.log("📄 Set page:", page);
    setCurrentPage(page);
  }, []);

  const handleSetSortBy = useCallback((newSortBy: SortOption) => {
    console.log("🔀 Set sort:", newSortBy);
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  const handleSetItemsPerPage = useCallback((count: number) => {
    console.log("📊 Set items per page:", count);
    setItemsPerPage(count);
    setCurrentPage(1);
  }, []);

  const combinedError = allToursError || searchQueryError || (searchError ? new Error(searchError) : null);

  return {
    allTours,
    searchResults,
    currentTours: getCurrentTours(),
    priceRange,
    searchQuery,
    filters,
    hasActiveSearch,
    currentPage,
    totalResults: searchResponse?.total,
    totalPages: searchResponse?.totalPages,
    isLoadingAllTours,
    isSearching,
    error: combinedError,
    updateSearch,
    clearSearch,
    refetchAllTours,
    setPage,
    setSortBy: handleSetSortBy,
    setItemsPerPage: handleSetItemsPerPage,
  };
};