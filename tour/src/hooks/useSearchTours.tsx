import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Tour, 
  SearchResult, 
  Filters, 
  PriceRange, 
  DURATION_MAP, 
  API_BASE_URL 
} from '../types/tours';

// Функція для маппінгу duration фільтрів на серверні значення
const mapDurationToServerValue = (durationIds: string[]): string | undefined => {
  if (durationIds.length === 0) return undefined;
  
  const maxDuration = Math.max(...durationIds.map(id => DURATION_MAP[id] || 7));
  return maxDuration.toString();
};

// Функція для побудови URL пошуку
const buildSearchUrl = (searchQuery: string, filters: Filters): string => {
  const params = new URLSearchParams();
  
  // Додаємо пошуковий запит
  if (searchQuery.trim()) {
    params.append("title", searchQuery.trim());
  }
  
  // Додаємо фільтри
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    params.append("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    params.append("maxPrice", String(filters.maxPrice));
  }
  
  // Duration mapping
  if (filters.duration && filters.duration.length > 0) {
    const duration = mapDurationToServerValue(filters.duration);
    if (duration) {
      params.append("duration", duration);
    }
  }
  
  // Rating mapping
  if (filters.rating && filters.rating.length > 0) {
    const minRating = Math.min(...filters.rating.map(r => parseInt(r)));
    params.append("minRating", String(minRating));
    
    const maxRating = Math.max(...filters.rating.map(r => parseInt(r)));
    if (minRating !== maxRating) {
      params.append("maxRating", String(maxRating));
    }
  }
  
  // Region mapping
  if (filters.region && filters.region.length > 0) {
    params.append("region", filters.region.join(","));
  }

  return `${API_BASE_URL}/search?${params.toString()}`;
};

export const useSearchTours = () => {
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Завантаження всіх турів для fallback
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
        throw new Error(`Помилка завантаження турів: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 хвилин
    gcTime: 10 * 60 * 1000,  // 10 хвилин
  });

  // Функція пошуку турів
  const searchTours = useCallback(async (searchQuery: string, filters: Filters) => {
    const searchUrl = buildSearchUrl(searchQuery, filters);
    const hasSearchParams = searchUrl.includes('?') && searchUrl.split('?')[1].length > 0;
    
    console.log("🔍 Пошук турів:", { searchQuery, filters, searchUrl, hasSearchParams });

    // Якщо немає параметрів пошуку - повертаємо всі тури
    if (!hasSearchParams) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return allTours;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      // Виконуємо пошук
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Помилка пошуку: ${searchResponse.status}`);
      }
      
      const searchData: SearchResult[] = await searchResponse.json();
      console.log("🔍 Результати пошуку (IDs):", searchData);

      if (Array.isArray(searchData) && searchData.length > 0) {
        // Отримуємо детальну інформацію про знайдені тури
        const idsString = searchData.map(item => item.id).join(",");
        const detailsResponse = await fetch(`${API_BASE_URL}/tours-search-by-ids?ids=${idsString}`);
        
        if (!detailsResponse.ok) {
          throw new Error(`Помилка завантаження деталей: ${detailsResponse.status}`);
        }
        
        const toursDetails: Tour[] = await detailsResponse.json();
        console.log("📋 Деталі знайдених турів:", toursDetails);
        
        // Додаткова клієнтська фільтрація по ціні
        let filteredTours = toursDetails;
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
          filteredTours = toursDetails.filter(tour => {
            const price = tour.price || 0;
            const matchesMin = filters.minPrice === undefined || price >= filters.minPrice;
            const matchesMax = filters.maxPrice === undefined || price <= filters.maxPrice;
            return matchesMin && matchesMax;
          });
        }
        
        console.log("🔍 Тури після клієнтської фільтрації:", filteredTours.length);
        setSearchResults(filteredTours);
        return filteredTours;
      } else {
        console.log("🔍 Нічого не знайдено");
        setSearchResults([]);
        return [];
      }
    } catch (error) {
      console.error("❌ Помилка пошуку:", error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка пошуку';
      setSearchError(errorMessage);
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [allTours]);

  // Обчислення діапазону цін з усіх турів
  const priceRange = useMemo(() => {
    if (!allTours.length) return { min: 0, max: 100000 };
    
    const prices = allTours
      .map(tour => tour.price || 0)
      .filter(price => price > 0);
    
    if (prices.length === 0) return { min: 0, max: 100000 };
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Додаємо 20% запасу до максимальної ціни
    const maxWithBuffer = Math.ceil(max * 1.2);
    
    return { min: 0, max: maxWithBuffer };
  }, [allTours]);

  // Функція для отримання поточних турів
  const getCurrentTours = useCallback((searchQuery: string, filters: Filters): Tour[] => {
    const hasActiveSearch = searchQuery.trim() || Object.keys(filters).length > 0;
    return hasActiveSearch ? searchResults : allTours;
  }, [searchResults, allTours]);

  // Функція для очищення результатів пошуку
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
  }, []);

  return {
    // Дані
    allTours,
    searchResults,
    priceRange,
    
    // Стани
    isLoadingAllTours,
    isSearching,
    searchError,
    allToursError,
    
    // Функції
    searchTours,
    getCurrentTours,
    clearSearchResults,
    refetchAllTours,
  };
};