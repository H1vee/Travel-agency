import React, { useState, useEffect, useCallback } from "react";
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
  BreadcrumbItem
} from "@heroui/react";
import { 
  Grid, 
  List, 
  Filter,
  ArrowUpDown,
  Users
} from "lucide-react";
import "./ToursPage.scss";

interface Tour {
  id: number;
  title: string;
  description: string;
  price: number;
  imageSrc: string;
  rating?: number;
  duration?: string;
  location?: string;
  participants?: number;
  isPopular?: boolean;
  discount?: number;
}

interface SearchTour {
  id: number;
}

type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'popular' | 'newest';
type ViewMode = 'grid' | 'list';

export const ToursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const { isPending, data: allTours = [], error, refetch } = useQuery({
    queryKey: ["toursData"],
    queryFn: async () => {
      const res = await fetch("http://127.0.0.1:1323/cards");
      if (!res.ok) {
        throw new Error(`Error loading tours: ${res.status}`);
      }
      return res.json();
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const searchTours = useCallback(async () => {
    const params = new URLSearchParams();
  
    if (searchQuery.trim()) {
      params.append("title", searchQuery);
    }
    if (filters.minPrice) {
      params.append("minPrice", String(filters.minPrice));
    }
    if (filters.maxPrice) {
      params.append("maxPrice", String(filters.maxPrice));
    }
    if (filters.duration?.length) {
      params.append("duration", filters.duration.join(","));
    }
  
    if (filters.rating?.length) {
      if (filters.rating.length === 1) {
        params.append("maxRating", String(filters.rating[0]));
      } else {
        const minRating = Math.min(...filters.rating);
        const maxRating = Math.max(...filters.rating);
        params.append("minRating", String(minRating));
        params.append("maxRating", String(maxRating));
      }
    }
    
    if (filters.region?.length) {
      params.append("region", filters.region.join(","));
    }
  
    const searchUrl = `http://127.0.0.1:1323/search?${params.toString()}`;
  
    if (!params.toString()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
  
    try {
      const res = await fetch(searchUrl);
      const searchTours: SearchTour[] = await res.json();
  
      if (Array.isArray(searchTours) && searchTours.length > 0) {
        const idsString = searchTours.map((item) => item.id).join(",");
        const detailsRes = await fetch(`http://127.0.0.1:1323/tours-search-by-ids?ids=${idsString}`);
        const tours: Tour[] = await detailsRes.json();
  
        setSearchResults(tours);
        setIsSearching(true);
      } else {
        setSearchResults([]);
        setIsSearching(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setIsSearching(true);
    }
  }, [searchQuery, filters]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchTours();
    }
  };

  const handleSearchClear = () => {
    setSearchResults([]);
    setIsSearching(false);
    setCurrentPage(1);
  };

  const sortTours = useCallback((tours: Tour[], sortOption: SortOption): Tour[] => {
    const sorted = [...tours];
    
    switch (sortOption) {
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
  }, []);

  useEffect(() => {
    const hasFilters = Object.values(filters).some((value) =>
      Array.isArray(value) ? value.length > 0 : value
    );
  
    if (searchQuery.trim() || hasFilters) {
      const delaySearch = setTimeout(searchTours, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [filters, searchQuery, searchTours]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortBy]);

  const currentTours = isSearching ? searchResults : allTours;
  const sortedTours = sortTours(currentTours, sortBy);
  const totalPages = Math.ceil(sortedTours.length / itemsPerPage);
  
  const indexOfLastTour = currentPage * itemsPerPage;
  const indexOfFirstTour = indexOfLastTour - itemsPerPage;
  const displayedTours = sortedTours.slice(indexOfFirstTour, indexOfLastTour);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value =>
      Array.isArray(value) ? value.length > 0 : value
    ).length;
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery("");
    setIsSearching(false);
    setCurrentPage(1);
  };

  const popularSearches = ["Карпати", "Київ", "Львів", "Одеса", "Європа"];

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
            setSearchQuery={setSearchQuery} 
            onKeyDown={handleKeyDown} 
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
              onApply={setFilters} 
              onReset={() => setFilters({})}
              isLoading={isPending}
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
                {(getActiveFiltersCount() > 0 || searchQuery) && (
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
                      {getActiveFiltersCount() > 0 && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="secondary"
                          onClose={clearAllFilters}
                        >
                          {getActiveFiltersCount()} фільтрів
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
                  onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as SortOption)}
                  className="sort-select"
                  variant="bordered"
                  startContent={<ArrowUpDown size={14} />}
                >
                  <SelectItem key="popular" startContent={<Users size={14} />}>
                    Популярні
                  </SelectItem>
                  <SelectItem key="price-asc" startContent="₴↑">
                    Ціна: за зростанням
                  </SelectItem>
                  <SelectItem key="price-desc" startContent="₴↓">
                    Ціна: за спаданням
                  </SelectItem>
                  <SelectItem key="rating-desc" startContent="⭐">
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
                  onSelectionChange={(keys) => {
                    setItemsPerPage(Number(Array.from(keys)[0]));
                    setCurrentPage(1);
                  }}
                  className="items-select"
                  variant="bordered"
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

            {/* Tours Cards */}
            <div className={`tours-content tours-content--${viewMode}`}>
              <Cards 
                tours={displayedTours} 
                loading={isPending}
                onRetry={refetch}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
                  classNames={{
                    wrapper: "pagination-wrapper",
                    item: "pagination-item",
                    cursor: "pagination-cursor"
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};