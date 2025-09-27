import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Tour, 
  SearchTourResult, 
  Filters, 
  PriceRange, 
  DURATION_MAP, 
  API_BASE_URL 
} from '../types/tours';

const mapDurationToServerValue = (durationIds: string[]): string | undefined => {
  if (durationIds.length === 0) return undefined;
  const maxDuration = Math.max(...durationIds.map(id => DURATION_MAP[id] || 7));
  return maxDuration.toString();
};

const buildSearchUrl = (searchQuery: string, filters: Filters): string => {
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
    const duration = mapDurationToServerValue(filters.duration);
    if (duration) {
      params.append("duration", duration);
    }
  }
  
  if (filters.rating && filters.rating.length > 0) {
    const minRating = Math.min(...filters.rating.map(r => parseInt(r)));
    params.append("minRating", String(minRating));
  }
  
  if (filters.region && filters.region.length > 0) {
    params.append("region", filters.region.join(","));
  }

  return `${API_BASE_URL}/search?${params.toString()}`;
};

export const useSearchTours = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({});
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
    return hasActiveSearch ? buildSearchUrl(searchQuery, filters) : null;
  }, [searchQuery, filters, hasActiveSearch]);

  const { 
    data: searchResults = [], 
    isPending: isSearching,
    error: searchQueryError
  } = useQuery({
    queryKey: ["searchTours", searchUrl],
    queryFn: async (): Promise<Tour[]> => {
      if (!searchUrl) return [];
      
      try {
        console.log("🔍 Виконуємо пошук:", searchUrl);
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
          throw new Error(`Помилка пошуку: ${response.status}`);
        }
        
        const searchData: SearchTourResult[] = await response.json();
        console.log("🔍 Результати пошуку:", searchData.length, "турів");

        if (!Array.isArray(searchData)) {
          console.warn("Отримано некоректні дані пошуку:", searchData);
          return [];
        }
        const tours: Tour[] = searchData.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          rating: item.rating,
          imageSrc: item.imageSrc,
          description: '',
          location: '',
          duration: '',
          participants: 0,
          isPopular: item.rating >= 4.5,
          discount: 0
        }));
        
        return tours;
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


  const updateSearch = useCallback((newQuery: string, newFilters: Filters) => {
    setSearchQuery(newQuery);
    setFilters(newFilters);
    setSearchError(null);
  }, []);

  const getCurrentTours = useCallback((): Tour[] => {
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
    setSearchError(null);
  }, []);

  const combinedError = allToursError || searchQueryError || searchError;

  return {
    allTours,
    searchResults,
    currentTours: getCurrentTours(),
    priceRange,
    searchQuery,
    filters,
    hasActiveSearch,
    
    isLoadingAllTours,
    isSearching,
    error: combinedError,
    
    updateSearch,
    clearSearch,
    refetchAllTours,
  };
};