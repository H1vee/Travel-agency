import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Cards } from "../Cards/Cards";
import { SearchBar } from "../SearchBar/SearchBar";
import { SideBar } from "../SideBar/SideBar";
import { useSearchTours } from "../../../../hooks/useSearchTours";
import { Filters, SortOption, ViewMode } from "../../../../types/tours";

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

export const ToursPage: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const {
    currentTours,
    priceRange,
    searchQuery,
    filters,
    hasActiveSearch,
    isLoadingAllTours,
    isSearching,
    error,
    updateSearch,
    clearSearch,
    refetchAllTours,
  } = useSearchTours();

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

  const savePreference = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to save preference ${key}:`, error);
    }
  }, []);

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
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }, [currentTours, sortBy]);

  const totalPages = Math.ceil(sortedTours.length / itemsPerPage);
  const indexOfLastTour = currentPage * itemsPerPage;
  const indexOfFirstTour = indexOfLastTour - itemsPerPage;
  const displayedTours = sortedTours.slice(indexOfFirstTour, indexOfLastTour);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((query: string) => {
    console.log("🔍 Новий пошуковий запит:", query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      updateSearch(query, filters);
      setCurrentPage(1);
    }, 500);
    
    setSearchTimeout(newTimeout);
  }, [filters, updateSearch, searchTimeout]);

  const handleSearchClear = useCallback(() => {
    console.log("🧹 Очищення пошуку");
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    clearSearch();
    setCurrentPage(1);
  }, [clearSearch, searchTimeout]);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    console.log("🔧 Нові фільтри:", newFilters);
    updateSearch(searchQuery, newFilters);
    setCurrentPage(1);
  }, [searchQuery, updateSearch]);

  const handleFiltersReset = useCallback(() => {
    console.log("🔄 Скидання фільтрів");
    clearSearch();
    setCurrentPage(1);
  }, [clearSearch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== undefined && filters.minPrice > 0) count++;
    if (filters.maxPrice !== undefined && filters.maxPrice < priceRange.max) count++;
    if (filters.duration && filters.duration.length > 0) count++;
    if (filters.rating && filters.rating.length > 0) count++;
    if (filters.region && filters.region.length > 0) count++;
    return count;
  }, [filters, priceRange.max]);

  const clearAllFilters = useCallback(() => {
    clearSearch();
    setCurrentPage(1);
  }, [clearSearch]);

  const popularSearches = ["Єгипет", "Дубай", "Париж", "Японія", "Італія"];

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

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const isLoading = isLoadingAllTours || (isSearching && currentTours.length === 0);

  return (
    <div className="tours-page">
      <div className="tours-page__wrapper">
        <div className="tours-page__breadcrumbs">
          <Breadcrumbs>
            <BreadcrumbItem href="/">Головна</BreadcrumbItem>
            <BreadcrumbItem>Тури</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        <div className="tours-page__header">
          <div className="page-title-section">
            <h1 className="page-title">
              Знайдіть свій ідеальний тур
              {hasActiveSearch && searchQuery && (
                <span className="search-highlight"> для "{searchQuery}"</span>
              )}
            </h1>
            <p className="page-subtitle">
              Відкрийте світ незабутніх подорожей разом з нами
            </p>
          </div>
        </div>

          <div className="tours-page__search" style={{ position: 'relative', zIndex: 9998 }}>
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={handleSearch} 
              onSearchClear={handleSearchClear}
              isLoading={isSearching}
              popularSearches={popularSearches}
            />
          </div>

        <div className="tours-page__content">
          <div className="tours-page__sidebar">
            <SideBar 
              onApply={handleFiltersChange} 
              onReset={handleFiltersReset}
              isLoading={isLoading}
              currentFilters={filters}
              priceRange={priceRange}
            />
          </div>

          <div className="tours-page__main">
            {!isLoading && !error && (
              <div className="results-header">
                <div className="results-info">
                  <div className="results-count">
                    <span className="count-number">{sortedTours.length}</span>
                    <span className="count-text">
                      {hasActiveSearch ? 'результатів знайдено' : 'турів доступно'}
                    </span>
                  </div>
                  
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
            )}

            {isLoading && (
              <div className="loading-state">
                <Spinner size="lg" color="primary" />
                <h3>
                  {isLoadingAllTours ? "Завантажуємо тури..." : "Шукаємо тури..."}
                </h3>
                <p>Будь ласка, зачекайте</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="error-state">
                <h3>Помилка завантаження</h3>
                <p>Не вдалося завантажити тури. Спробуйте ще раз.</p>
                <Button 
                  color="primary" 
                  onClick={() => refetchAllTours()}
                  startContent={<RefreshCw size={16} />}
                >
                  Оновити
                </Button>
              </div>
            )}

            {!isLoading && !error && sortedTours.length === 0 && hasActiveSearch && (
              <div className="no-results-state">
                <div className="error-state">
                  <div className="error-state__content">
                    <div className="error-state__icon">🔍</div>
                    <h3 className="error-state__title">Нічого не знайдено</h3>
                    <p className="error-state__description">
                      Спробуйте змінити параметри пошуку або фільтри
                    </p>
                    <Button 
                      color="primary" 
                      variant="bordered"
                      onClick={clearAllFilters}
                      className="error-state__button"
                    >
                      Скинути фільтри
                    </Button>
                  </div>
                </div>
              </div>
            )}


            {!isLoading && !error && sortedTours.length > 0 && (
              <div className={`tours-content tours-content--${viewMode}`}>
                <Cards 
                  tours={displayedTours} 
                  loading={false}
                  onRetry={refetchAllTours}
                />
              </div>
            )}

            {!isLoading && !error && totalPages > 1 && (
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
  );
};