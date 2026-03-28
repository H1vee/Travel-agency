import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Cards } from "../Cards/Cards";
import { useSearchTours } from "../../../../hooks/useSearchTours";
import { Filters, SortOption, REGIONS, DURATIONS, RATINGS } from "../../../../types/tours";
import {
  Pagination,
  Select,
  SelectItem,
  Button,
  Chip,
  Breadcrumbs,
  BreadcrumbItem,
  Spinner,
  Input,
  Checkbox,
  Slider,
} from "@heroui/react";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Star,
  RotateCcw,
  ArrowUpDown,
} from "lucide-react";
import "./ToursPage.scss";

export const ToursPage: React.FC = () => {
  const [sortBy, setSortByLocal] = useState<SortOption>(() => {
    return (localStorage.getItem('tours-sort-by') as SortOption) || 'price_asc';
  });
  const [itemsPerPage, setItemsPerPageLocal] = useState<number>(() => {
    const saved = localStorage.getItem('tours-items-per-page');
    return saved ? parseInt(saved) : 12;
  });

  // Filter panel state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>({});
  const [priceInputs, setPriceInputs] = useState<[number, number]>([0, 100000]);

  // Search input (local — only applied on Enter or button click)
  const [inputValue, setInputValue] = useState('');

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

  // Sync price range from data
  useEffect(() => {
    setPriceInputs([priceRange.min, priceRange.max]);
    setLocalFilters(prev => ({ ...prev }));
  }, [priceRange.min, priceRange.max]);

  // Sync external filters to local
  useEffect(() => {
    setLocalFilters(filters);
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      setPriceInputs([
        filters.minPrice ?? priceRange.min,
        filters.maxPrice ?? priceRange.max,
      ]);
    }
  }, []);

  useEffect(() => {
    setSortBy(sortBy);
    setItemsPerPage(itemsPerPage);
  }, []);

  const handleSearch = useCallback(() => {
    updateSearch(inputValue.trim(), localFilters);
  }, [inputValue, localFilters, updateSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    setLocalFilters({});
    setPriceInputs([priceRange.min, priceRange.max]);
    updateSearch('', {});
  };

  const applyFilters = useCallback(() => {
    const f: Filters = { ...localFilters };
    if (priceInputs[0] > priceRange.min) f.minPrice = priceInputs[0];
    if (priceInputs[1] < priceRange.max) f.maxPrice = priceInputs[1];
    updateSearch(inputValue.trim() || searchQuery, f);
    setFiltersOpen(false);
  }, [localFilters, priceInputs, priceRange, inputValue, searchQuery, updateSearch]);

  const resetFilters = () => {
    setLocalFilters({});
    setPriceInputs([priceRange.min, priceRange.max]);
    clearSearch();
    setInputValue('');
    setFiltersOpen(false);
  };

  const toggleArrayFilter = (key: 'duration' | 'rating' | 'region', value: string) => {
    setLocalFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated.length ? updated : undefined };
    });
  };

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (searchQuery) n++;
    if (filters.minPrice || filters.maxPrice) n++;
    if (filters.duration?.length) n++;
    if (filters.rating?.length) n++;
    if (filters.region?.length) n++;
    return n;
  }, [filters, searchQuery]);

  const isLoading = isLoadingAllTours || (isSearching && currentTours.length === 0);

  const formatPrice = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}К` : `${v}`;

  return (
    <div className="tp">
      {/* ── Breadcrumbs ── */}
      <div className="tp__breadcrumbs">
        <Breadcrumbs>
          <BreadcrumbItem href="/">Головна</BreadcrumbItem>
          <BreadcrumbItem>Тури</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      {/* ── Hero search bar ── */}
      <div className="tp__hero">
        <h1 className="tp__hero-title">Знайдіть свій тур</h1>

        <div className="tp__search-row">
          {/* Text search */}
          <div className="tp__search-input-wrap">
            <Search size={18} className="tp__search-icon" />
            <input
              className="tp__search-input"
              placeholder="Назва туру, країна, місто..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {inputValue && (
              <button className="tp__search-clear" onClick={() => setInputValue('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            className={`tp__filter-btn ${filtersOpen ? 'tp__filter-btn--open' : ''} ${activeFiltersCount > 0 ? 'tp__filter-btn--active' : ''}`}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <SlidersHorizontal size={16} />
            <span>Фільтри</span>
            {activeFiltersCount > 0 && (
              <span className="tp__filter-badge">{activeFiltersCount}</span>
            )}
            <ChevronDown size={14} className={`tp__filter-chevron ${filtersOpen ? 'tp__filter-chevron--up' : ''}`} />
          </button>

          {/* Search button */}
          <button className="tp__search-btn" onClick={handleSearch}>
            <Search size={16} />
            <span>Шукати</span>
          </button>
        </div>

        {/* ── Inline filter panel ── */}
        {filtersOpen && (
          <div className="tp__filter-panel">
            <div className="tp__filter-grid">

              {/* Price */}
              <div className="tp__filter-section">
                <div className="tp__filter-label">
                  Ціна
                  <span className="tp__filter-range">
                    ₴{formatPrice(priceInputs[0])} – ₴{formatPrice(priceInputs[1])}
                  </span>
                </div>
                <Slider
                  minValue={priceRange.min}
                  maxValue={priceRange.max}
                  step={Math.max(500, Math.floor((priceRange.max - priceRange.min) / 100))}
                  value={priceInputs}
                  onChange={v => setPriceInputs(v as [number, number])}
                  size="sm"
                  color="primary"
                  className="tp__slider"
                />
                <div className="tp__price-inputs">
                  <Input
                    size="sm"
                    type="number"
                    variant="bordered"
                    label="Від"
                    value={priceInputs[0].toString()}
                    onChange={e => setPriceInputs([Number(e.target.value), priceInputs[1]])}
                    startContent={<span style={{ fontSize: 12, color: '#64748b' }}>₴</span>}
                  />
                  <Input
                    size="sm"
                    type="number"
                    variant="bordered"
                    label="До"
                    value={priceInputs[1].toString()}
                    onChange={e => setPriceInputs([priceInputs[0], Number(e.target.value)])}
                    startContent={<span style={{ fontSize: 12, color: '#64748b' }}>₴</span>}
                  />
                </div>
              </div>

              {/* Region */}
              <div className="tp__filter-section">
                <div className="tp__filter-label">Регіон</div>
                <div className="tp__check-list">
                  {REGIONS.map(r => (
                    <label key={r.id} className="tp__check-item">
                      <input
                        type="checkbox"
                        checked={(localFilters.region || []).includes(r.id)}
                        onChange={() => toggleArrayFilter('region', r.id)}
                      />
                      <span>{r.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="tp__filter-section">
                <div className="tp__filter-label">Тривалість</div>
                <div className="tp__check-list">
                  {DURATIONS.map(d => (
                    <label key={d.id} className="tp__check-item">
                      <input
                        type="checkbox"
                        checked={(localFilters.duration || []).includes(d.id)}
                        onChange={() => toggleArrayFilter('duration', d.id)}
                      />
                      <span>{d.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="tp__filter-section">
                <div className="tp__filter-label">Рейтинг</div>
                <div className="tp__check-list">
                  {RATINGS.map(r => (
                    <label key={r.id} className="tp__check-item">
                      <input
                        type="checkbox"
                        checked={(localFilters.rating || []).includes(r.id)}
                        onChange={() => toggleArrayFilter('rating', r.id)}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />
                        ))}
                        <span style={{ color: '#64748b', fontSize: 12 }}>{r.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="tp__filter-actions">
              <button className="tp__filter-reset" onClick={resetFilters}>
                <RotateCcw size={14} />
                Скинути
              </button>
              <button className="tp__filter-apply" onClick={applyFilters}>
                Застосувати фільтри
              </button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <div className="tp__active-chips">
            {searchQuery && (
              <Chip size="sm" variant="flat" color="primary" onClose={handleClear}>
                "{searchQuery}"
              </Chip>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Chip size="sm" variant="flat" color="secondary"
                onClose={() => { setLocalFilters(p => ({ ...p, minPrice: undefined, maxPrice: undefined })); applyFilters(); }}>
                ₴{formatPrice(filters.minPrice ?? 0)} – ₴{formatPrice(filters.maxPrice ?? priceRange.max)}
              </Chip>
            )}
            {(filters.region || []).map(id => {
              const r = REGIONS.find(x => x.id === id);
              return r ? (
                <Chip key={id} size="sm" variant="flat" color="default"
                  onClose={() => { toggleArrayFilter('region', id); applyFilters(); }}>
                  {r.name}
                </Chip>
              ) : null;
            })}
            {(filters.duration || []).map(id => {
              const d = DURATIONS.find(x => x.id === id);
              return d ? (
                <Chip key={id} size="sm" variant="flat" color="default"
                  onClose={() => { toggleArrayFilter('duration', id); applyFilters(); }}>
                  {d.name}
                </Chip>
              ) : null;
            })}
            {(filters.rating || []).map(id => (
              <Chip key={id} size="sm" variant="flat" color="warning"
                onClose={() => { toggleArrayFilter('rating', id); applyFilters(); }}>
                {id}+ ★
              </Chip>
            ))}
            <button className="tp__clear-all" onClick={handleClear}>
              Очистити все
            </button>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="tp__results">
        {/* Results header */}
        {!isLoading && !error && (
          <div className="tp__results-header">
            <span className="tp__results-count">
              <strong>{totalResults ?? currentTours.length}</strong>
              {' '}{hasActiveSearch ? 'результатів' : 'турів'}
            </span>

            <div className="tp__results-controls">
              <Select
                size="sm"
                variant="bordered"
                label="Сортування"
                selectedKeys={new Set([sortBy])}
                onSelectionChange={keys => {
                  const v = Array.from(keys)[0] as SortOption;
                  setSortByLocal(v);
                  setSortBy(v);
                  localStorage.setItem('tours-sort-by', v);
                }}
                startContent={<ArrowUpDown size={14} />}
                className="tp__sort-select"
              >
                <SelectItem key="price_asc">Ціна: від низької</SelectItem>
                <SelectItem key="price_desc">Ціна: від високої</SelectItem>
                <SelectItem key="rating_desc">Рейтинг</SelectItem>
                <SelectItem key="newest">Новинки</SelectItem>
              </Select>
            </div>
          </div>
        )}

        {/* States */}
        {isLoading && (
          <div className="tp__state">
            <Spinner size="lg" color="primary" />
            <p>{isLoadingAllTours ? 'Завантаження турів...' : 'Пошук...'}</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="tp__state tp__state--error">
            <p>Не вдалося завантажити тури</p>
            <Button color="primary" size="sm" onClick={refetchAllTours}>Оновити</Button>
          </div>
        )}

        {!isLoading && !error && currentTours.length === 0 && hasActiveSearch && (
          <div className="tp__state">
            <div className="tp__empty-icon">🔍</div>
            <p>Нічого не знайдено</p>
            <span>Спробуйте змінити фільтри або пошуковий запит</span>
            <Button color="primary" variant="flat" size="sm" onClick={handleClear}>
              Скинути пошук
            </Button>
          </div>
        )}

        {!isLoading && !error && currentTours.length > 0 && (
          <Cards tours={currentTours} loading={false} onRetry={refetchAllTours} />
        )}

        {!isLoading && !error && totalPages && totalPages > 1 && (
          <div className="tp__pagination">
            <Pagination
              page={currentPage}
              total={totalPages}
              onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              showControls
              color="primary"
            />
          </div>
        )}
      </div>
    </div>
  );
};