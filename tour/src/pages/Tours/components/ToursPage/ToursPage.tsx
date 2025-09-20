import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cards } from "../Cards/Cards";
import { SearchBar } from "../SearchBar/SearchBar";
import { SideBar } from "../SideBar/SideBar";

import { 
  Pagination, 
  Select, 
  SelectItem, 
  Button, 
  Chip,
  Breadcrumbs,
  BreadcrumbItem,
  Spinner
} from "@heroui/react";
import { 
  Grid, 
  List, 
  Filter,
  ArrowUpDown,
  Users,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import "./ToursPage.scss";

interface Tour {
  id: number;
  title: string;
  price: number;
  imageSrc: string;
  region?: string;
  duration?: number;
  rating?: number;
}

interface SearchResult {
  id: number;
}

interface Filters {
  minPrice?: number;
  maxPrice?: number;
  duration?: string[];
  rating?: string[];
  region?: string[];
}

type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'popular' | 'newest';
type ViewMode = 'grid' | 'list';

const API_BASE_URL = "http://127.0.0.1:1323";

export const ToursPage: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem('tours-view-mode') as ViewMode;
      const savedItemsPerPage = localStorage.getItem('tours-items-per-page');
      const savedSortBy = localStorage.getItem('tours-sort-by') as SortOption;

      if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) {
        setViewMode(savedViewMode);
      }
      if (savedItemsPerPage && [12, 24, 48].includes(Number(savedItemsPerPage))) {
        setItemsPerPage(Number(savedItemsPerPage));
      }
      if (savedSortBy && ['price-asc', 'price-desc', 'rating-desc', 'popular', 'newest'].includes(savedSortBy)) {
        setSortBy(savedSortBy);
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const savePreference = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to save preference ${key}:`, error);
    }
  }, []);

  // Fetch all tours for fallback
  const { isPending: isLoadingAllTours, data: allTours = [], error, refetch } = useQuery({
    queryKey: ["toursData"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/cards`);
      if (!res.ok) {
        throw new Error(`Помилка завантаження турів: ${res.status}`);
      }
      const data = await res.json();
      console.log("🔍 Завантажено всіх турів:", data.length);
      return Array.isArray(data) ? data : [];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Search function using server API
  const searchTours = useCallback(async () => {
    const params = new URLSearchParams();
    
    // Add search query
    if (searchQuery.trim()) {
      params.append("title", searchQuery.trim());
    }
    
    // Add filters
    if (filters.minPrice !== undefined) {
      params.append("minPrice", String(filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      params.append("maxPrice", String(filters.maxPrice));
    }
    if (filters.duration && filters.duration.length > 0) {
      params.append("duration", filters.duration.join(","));
    }
    if (filters.rating && filters.rating.length > 0) {
      const minRating = Math.min(...filters.rating.map(r => parseInt(r)));
      const maxRating = Math.max(...filters.rating.map(r => parseInt(r)));
      params.append("minRating", String(minRating));
      if (minRating !== maxRating) {
        params.append("maxRating", String(maxRating));
      }
    }
    if (filters.region && filters.region.length > 0) {
      params.append("region", filters.region.join(","));
    }

    const searchUrl = `${API_BASE_URL}/search?${params.toString()}`;
    console.log("🔍 Пошуковий URL:", searchUrl);

    // If no search parameters - show all tours
    if (!params.toString()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      
      // Perform search
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`);
      }
      
      const searchData: SearchResult[] = await searchResponse.json();
      console.log("🔍 Результати пошуку (ID):", searchData);

      if (Array.isArray(searchData) && searchData.length > 0) {
        // Get detailed information about found tours
        const idsString = searchData.map(item => item.id).join(",");
        const detailsResponse = await fetch(`${API_BASE_URL}/tours-search-by-ids?ids=${idsString}`);
        
        if (!detailsResponse.ok) {
          throw new Error(`Details fetch failed: ${detailsResponse.status}`);
        }
        
        const toursDetails: Tour[] = await detailsResponse.json();
        console.log("📋 Деталі турів:", toursDetails);
        setSearchResults(toursDetails);
      } else {
        console.log("🔍 Нічого не знайдено");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("❌ Помилка пошуку:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, filters]);

  // Trigger search when query or filters change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTours();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, searchTours]);

  // Determine which tours to display
  const currentTours = useMemo(() => {
    return (searchQuery.trim() || Object.keys(filters).length > 0) ? searchResults : allTours;
  }, [searchQuery, filters, searchResults, allTours]);
  
  // Sort tours
  const sortedTours = useMemo(() => {
    const sorted = [...currentTours];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating-desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return sorted.sort((a, b) => b.id - a.id);
      case 'popular':
      default:
        return sorted;
    }
  }, [currentTours, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedTours.length / itemsPerPage);
  const indexOfLastTour = currentPage * itemsPerPage;
  const indexOfFirstTour = indexOfLastTour - itemsPerPage;
  const displayedTours = sortedTours.slice(indexOfFirstTour, indexOfLastTour);

  // Event handlers
  const handleSearch = useCallback((query: string) => {
    console.log("🔍 Новий пошуковий запит:", query);
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    console.log("🧹 Очищення пошуку");
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setCurrentPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    console.log("🔧 Нові фільтри:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleFiltersReset = useCallback(() => {
    console.log("🔄 Скидання фільтрів");
    setFilters({});
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSortChange = useCallback((keys: any) => {
    const newSort = Array.from(keys)[0] as SortOption;
    console.log("🔀 Нове сортування:", newSort);
    setSortBy(newSort);
    setCurrentPage(1);
    savePreference('tours-sort-by', newSort);
  }, [savePreference]);

  const handleItemsPerPageChange = useCallback((keys: any) => {
    const newCount = Number(Array.from(keys)[0]);
    console.log("📄 Нова кількість на сторінці:", newCount);
    setItemsPerPage(newCount);
    setCurrentPage(1);
    savePreference('tours-items-per-page', newCount.toString());
  }, [savePreference]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    savePreference('tours-view-mode', mode);
  }, [savePreference]);

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.duration && filters.duration.length > 0) count++;
    if (filters.rating && filters.rating.length > 0) count++;
    if (filters.region && filters.region.length > 0) count++;
    return count;
  }, [filters]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setCurrentPage(1);
  }, []);

  const popularSearches = ["Єгипет", "Дубай", "Бостон", "Мальдіви", "Тайвань"];
  const hasSearchOrFilters = !!searchQuery.trim() || activeFiltersCount > 0;

  return (
    <>
      <div className="tours-page">
        <div className="tours-page__wrapper">
          {/* Breadcrumbs */}
          <div className="tours-page__breadcrumbs">
            <Breadcrumbs>
              <BreadcrumbItem href="/">Головна</BreadcrumbItem>
              <BreadcrumbItem>Тури</BreadcrumbItem>
            </Breadcrumbs>
          </div>

          {/* Header */}
          <div className="tours-page__header">
            <div className="page-title-section">
              <h1 className="page-title">
                Знайдіть свій ідеальний тур
                {hasSearchOrFilters && searchQuery && (
                  <span className="search-highlight"> для "{searchQuery}"</span>
                )}
              </h1>
              <p className="page-subtitle">
                Відкрийте світ незабутніх подорожей разом з нами
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="tours-page__search">
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={handleSearch} 
              onSearchClear={handleSearchClear}
              isLoading={isLoadingAllTours || isSearching}
              popularSearches={popularSearches}
            />
          </div>

          {/* Main Content */}
          <div className="tours-page__content">
            {/* Sidebar */}
            <div className="tours-page__sidebar">
              <SideBar 
                onApply={handleFiltersChange} 
                onReset={handleFiltersReset}
                isLoading={isLoadingAllTours || isSearching}
                currentFilters={filters}
              />
            </div>

            {/* Tours Content */}
            <div className="tours-page__main">
              {/* Results Header */}
              <div className="results-header">
                <div className="results-info">
                  <div className="results-count">
                    <span className="count-number">{sortedTours.length}</span>
                    <span className="count-text">
                      {hasSearchOrFilters ? 'результатів знайдено' : 'турів доступно'}
                    </span>
                  </div>
                  
                  {/* Active Filters */}
                  {(activeFiltersCount > 0 || searchQuery) && (
                    <div className="active-filters">
                      <div className="filters-header">
                        <Filter size={14} />
                        <span>Активні фільтри:</span>
                      </div>
                      <div className="filters-chips">
                        {searchQuery && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="primary"
                            onClose={() => {
                              setSearchQuery("");
                              handleSearchClear();
                            }}
                          >
                            Пошук: "{searchQuery}"
                          </Chip>
                        )}
                        {activeFiltersCount > 0 && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onClose={clearAllFilters}
                          >
                            {activeFiltersCount} фільтрів
                          </Chip>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="results-controls">
                  {/* Sort Select */}
                  <Select
                    size="sm"
                    label="Сортування"
                    selectedKeys={[sortBy]}
                    onSelectionChange={handleSortChange}
                    className="sort-select"
                    variant="bordered"
                    startContent={<ArrowUpDown size={14} />}
                  >
                    <SelectItem key="popular" startContent={<TrendingUp size={14} />}>
                      Популярні
                    </SelectItem>
                    <SelectItem key="price-asc" startContent="₴↑">
                      Ціна: за зростанням
                    </SelectItem>
                    <SelectItem key="price-desc" startContent="₴↓">
                      Ціна: за спаданням
                    </SelectItem>
                    <SelectItem key="rating-desc" startContent="⭐">
                      Найкращий рейтинг
                    </SelectItem>
                    <SelectItem key="newest" startContent="🆕">
                      Нові
                    </SelectItem>
                  </Select>

                  {/* Items Per Page */}
                  <Select
                    size="sm"
                    label="На сторінці"
                    selectedKeys={[itemsPerPage.toString()]}
                    onSelectionChange={handleItemsPerPageChange}
                    className="items-select"
                    variant="bordered"
                    startContent={<Users size={14} />}
                  >
                    <SelectItem key="12">12</SelectItem>
                    <SelectItem key="24">24</SelectItem>
                    <SelectItem key="48">48</SelectItem>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="view-mode-toggle">
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'solid' : 'bordered'}
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                      isIconOnly
                      onClick={() => handleViewModeChange('grid')}
                      aria-label="Grid view"
                    >
                      <Grid size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'solid' : 'bordered'}
                      color={viewMode === 'list' ? 'primary' : 'default'}
                      isIconOnly
                      onClick={() => handleViewModeChange('list')}
                      aria-label="List view"
                    >
                      <List size={16} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {(isLoadingAllTours || isSearching) && (
                <div className="loading-state">
                  <Spinner size="lg" color="primary" />
                  <h3>{isSearching ? "Шукаємо тури..." : "Завантажуємо тури..."}</h3>
                  <p>Зачекайте, будь ласка</p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoadingAllTours && (
                <div className="error-state">
                  <h3>Помилка завантаження</h3>
                  <p>Не вдалося завантажити тури. Спробуйте ще раз.</p>
                  <Button 
                    color="primary" 
                    onClick={() => refetch()}
                    startContent={<RefreshCw size={16} />}
                  >
                    Оновити
                  </Button>
                </div>
              )}

              {/* No Results State */}
              {!isLoadingAllTours && !isSearching && !error && sortedTours.length === 0 && hasSearchOrFilters && (
                <div className="no-results-state">
                  <h3>Нічого не знайдено</h3>
                  <p>Спробуйте змінити параметри пошуку або фільтри</p>
                  <Button 
                    color="primary" 
                    variant="bordered"
                    onClick={clearAllFilters}
                  >
                    Скинути фільтри
                  </Button>
                </div>
              )}

              {/* Tours Cards */}
              {!isLoadingAllTours && !isSearching && !error && sortedTours.length > 0 && (
                <div className={`tours-content tours-content--${viewMode}`}>
                  <Cards 
                    tours={displayedTours} 
                    loading={false}
                    onRetry={refetch}
                  />
                </div>
              )}

              {/* Pagination */}
              {!isLoadingAllTours && !isSearching && !error && totalPages > 1 && (
                <div className="tours-page__pagination">
                  <div className="pagination-info">
                    <span>
                      Показано {indexOfFirstTour + 1}-{Math.min(indexOfLastTour, sortedTours.length)} з {sortedTours.length} турів
                    </span>
                  </div>
                  <Pagination
                    page={currentPage}
                    total={totalPages}
                    onChange={handlePageChange}
                    showControls
                    showShadow
                    size="lg"
                    className="pagination-component"
                    color="primary"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};