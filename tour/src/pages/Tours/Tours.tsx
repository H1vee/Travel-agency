import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cards } from "./components/Cards/Cards";
import { SearchBar } from "./components/SearchBar/SearchBar";
import { SideBar } from "./components/SideBar/SideBar";
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
  Star,
  TrendingUp
} from "lucide-react";
import "./Tours.scss";

interface Tour {
  id: number;
  title: string;
  description?: string;
  price: number;
  imageSrc: string;
  rating?: number;
  duration?: string;
  location?: string;
  participants?: number;
  isPopular?: boolean;
  discount?: number;
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

export const ToursPage: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all tours
  const { isPending, data: allTours = [], error, refetch } = useQuery({
    queryKey: ["toursData"],
    queryFn: async () => {
      const res = await fetch("http://127.0.0.1:1323/cards");
      if (!res.ok) {
        throw new Error(`Помилка завантаження турів: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  // Filter tours based on search query and filters
  const filteredTours = useMemo(() => {
    let result = [...allTours];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(tour => 
        tour.title?.toLowerCase().includes(query) ||
        tour.description?.toLowerCase().includes(query) ||
        tour.location?.toLowerCase().includes(query)
      );
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }

    // Price filter
    if (filters.minPrice !== undefined) {
      result = result.filter(tour => tour.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter(tour => tour.price <= filters.maxPrice!);
    }

    // Duration filter
    if (filters.duration && filters.duration.length > 0) {
      result = result.filter(tour => {
        if (!tour.duration) return false;
        return filters.duration!.some(duration => {
          const tourDays = parseInt(tour.duration?.split(' ')[0] || '0');
          switch (duration) {
            case '1-3': return tourDays >= 1 && tourDays <= 3;
            case '4-7': return tourDays >= 4 && tourDays <= 7;
            case '8-14': return tourDays >= 8 && tourDays <= 14;
            case '15+': return tourDays >= 15;
            default: return false;
          }
        });
      });
    }

    // Rating filter
    if (filters.rating && filters.rating.length > 0) {
      result = result.filter(tour => {
        if (!tour.rating) return false;
        return filters.rating!.some(rating => {
          const minRating = parseInt(rating);
          return tour.rating! >= minRating;
        });
      });
    }

    return result;
  }, [allTours, searchQuery, filters]);

  // Sort tours
  const sortedTours = useMemo(() => {
    const sorted = [...filteredTours];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating-desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'popular':
        return sorted.sort((a, b) => {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return (b.rating || 0) - (a.rating || 0);
        });
      case 'newest':
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  }, [filteredTours, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedTours.length / itemsPerPage);
  const indexOfLastTour = currentPage * itemsPerPage;
  const indexOfFirstTour = indexOfLastTour - itemsPerPage;
  const displayedTours = sortedTours.slice(indexOfFirstTour, indexOfLastTour);

  // Event handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSortChange = useCallback((keys: any) => {
    setSortBy(Array.from(keys)[0] as SortOption);
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((keys: any) => {
    setItemsPerPage(Number(Array.from(keys)[0]));
    setCurrentPage(1);
  }, []);

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
    setCurrentPage(1);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortBy]);

  const popularSearches = ["Єгипет", "Дубай", "Бостон", "Мальдіви", "Тайвань"];

  return (
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
              {isSearching && searchQuery && (
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
            isLoading={isPending}
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
              isLoading={isPending}
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
                    {isSearching ? 'результатів знайдено' : 'турів доступно'}
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
                  <SelectItem key="rating-desc" startContent={<Star size={14} />}>
                    Найкращі рейтинги
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
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'solid' : 'bordered'}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                    isIconOnly
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isPending && (
              <div className="loading-state">
                <Spinner size="lg" />
                <p>Завантажуємо тури...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-state">
                <h3>Помилка завантаження</h3>
                <p>Не вдалося завантажити тури. Спробуйте ще раз.</p>
                <Button color="primary" onClick={() => refetch()}>
                  Оновити
                </Button>
              </div>
            )}

            {/* Tours Cards */}
            {!isPending && !error && (
              <div className={`tours-content tours-content--${viewMode}`}>
                <Cards 
                  tours={displayedTours} 
                  loading={false}
                  onRetry={refetch}
                />
              </div>
            )}

            {/* Pagination */}
            {!isPending && !error && totalPages > 1 && (
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
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};