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
  RefreshCw
} from "lucide-react";
import "./ToursPage.scss";

export const ToursPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortByLocal] = useState<SortOption>(() => {
    const saved = localStorage.getItem('tours-sort-by') as SortOption;
    return saved || 'price_asc';
  });
  const [itemsPerPage, setItemsPerPageLocal] = useState<number>(() => {
    const saved = localStorage.getItem('tours-items-per-page');
    return saved ? parseInt(saved) : 12;
  });

  const {
    currentTours,
    priceRange,
    searchQuery,
    filters,
    hasActiveSearch,
    currentPage,
    totalResults,
    totalPages,
    isLoadingAllTours,
    isSearching,
    error,
    updateSearch,
    clearSearch,
    refetchAllTours,
    setPage,
    setSortBy,
    setItemsPerPage,
  } = useSearchTours();

  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem('tours-view-mode') as ViewMode;
      if (savedViewMode && ['grid', 'list'].includes(savedViewMode)) {
        setViewMode(savedViewMode);
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }, []);

  useEffect(() => {
    setSortBy(sortBy);
    setItemsPerPage(itemsPerPage);
  }, []);

  const savePreference = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to save preference ${key}:`, error);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    updateSearch(query, filters);
  }, [filters, updateSearch]);

  const handleSearchClear = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    updateSearch(searchQuery, newFilters);
  }, [searchQuery, updateSearch]);

  const handleFiltersReset = useCallback(() => {
    clearSearch();
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
  }, [clearSearch]);

  const popularSearches = ["Єгипет", "Дубай", "Париж", "Японія", "Італія"];

  const handlePageChange = useCallback((page: number) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setPage]);

  const handleSortChange = useCallback((keys: any) => {
    const newSort = Array.from(keys)[0] as SortOption;
    setSortByLocal(newSort);
    setSortBy(newSort);
    savePreference('tours-sort-by', newSort);
  }, [setSortBy, savePreference]);

  const handleItemsPerPageChange = useCallback((keys: any) => {
    const newCount = Number(Array.from(keys)[0]);
    setItemsPerPageLocal(newCount);
    setItemsPerPage(newCount);
    savePreference('tours-items-per-page', newCount.toString());
  }, [setItemsPerPage, savePreference]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    savePreference('tours-view-mode', mode);
  }, [savePreference]);

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

        <div className="tours-page__search" style={{ position: 'relative', zIndex: 10 }}>
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
              isLoading={false}
              currentFilters={filters}
              priceRange={priceRange}
            />
          </div>

          <div className="tours-page__main" style={{ position: 'relative', zIndex: 1 }}>
            {!isLoading && !error && (
              <div className="results-header">
                <div className="results-info">
                  <div className="results-count">
                    <span className="count-number">{totalResults || currentTours.length}</span>
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
                    selectedKeys={new Set([sortBy])}
                    onSelectionChange={handleSortChange}
                    className="sort-select"
                    variant="bordered"
                    startContent={<ArrowUpDown size={14} />}
                  >
                    <SelectItem key="price_asc" startContent="₴↑">
                      Ціна: за зростанням
                    </SelectItem>
                    <SelectItem key="price_desc" startContent="₴↓">
                      Ціна: за спаданням
                    </SelectItem>
                  </Select>

                  <Select
                    size="sm"
                    label="На сторінці"
                    selectedKeys={new Set([itemsPerPage.toString()])}
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

            {!isLoading && !error && currentTours.length === 0 && hasActiveSearch && (
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

            {!isLoading && !error && currentTours.length > 0 && (
              <div className={`tours-content tours-content--${viewMode}`}>
                <Cards 
                  tours={currentTours} 
                  loading={false}
                  onRetry={refetchAllTours}
                />
              </div>
            )}

            {!isLoading && !error && totalPages && totalPages > 1 && (
              <div className="tours-page__pagination">
                <div className="pagination-info">
                  <span>
                    Показано {currentTours.length} з {totalResults || 0} турів 
                    (сторінка {currentPage} з {totalPages})
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