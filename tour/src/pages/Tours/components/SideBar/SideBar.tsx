import { CheckboxGroup, Checkbox, Slider, Input, Button, Badge, Divider, Chip } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { Filter, X, RotateCcw, Sparkles, Star } from "lucide-react";
import "./SideBar.scss";

interface Filters {
  minPrice?: number;
  maxPrice?: number;
  duration?: string[];
  rating?: string[];
  region?: string[];
}

interface SideBarProps {
  onApply: (filters: Filters) => void;
  onReset: () => void;
  isLoading?: boolean;
  currentFilters?: Filters;
}

export const SideBar: React.FC<SideBarProps> = ({ 
  onApply, 
  onReset, 
  isLoading = false, 
  currentFilters = {} 
}) => {
  const minValue = 0;
  const maxValue = 20000;
  
  // Initialize state from currentFilters
  const [sliderValue, setSliderValue] = useState([
    currentFilters.minPrice || minValue, 
    currentFilters.maxPrice || maxValue
  ]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>(
    currentFilters.duration || []
  );
  const [selectedRatings, setSelectedRatings] = useState<string[]>(
    currentFilters.rating || []
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    currentFilters.region || []
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Filter options
  const regions = [
    { id: "ukraine", name: "Україна", count: 5 },
    { id: "europe", name: "Європа", count: 8 },
    { id: "asia", name: "Азія", count: 6 },
    { id: "america", name: "Америка", count: 4 },
    { id: "middle-east", name: "Близький Схід", count: 3 },
    { id: "oceania", name: "Океанія", count: 2 }
  ];

  const durations = [
    { id: "1-3", name: "1-3 дні", count: 8 },
    { id: "4-7", name: "4-7 днів", count: 15 },
    { id: "8-14", name: "8-14 днів", count: 10 },
    { id: "15+", name: "15+ днів", count: 5 }
  ];

  const ratings = [
    { id: "5", stars: 5, label: "5 зірок" },
    { id: "4", stars: 4, label: "4+ зірки" },
    { id: "3", stars: 3, label: "3+ зірки" },
    { id: "2", stars: 2, label: "2+ зірки" },
    { id: "1", stars: 1, label: "1+ зірка" }
  ];

  // Update state when currentFilters change
  useEffect(() => {
    setSliderValue([
      currentFilters.minPrice || minValue,
      currentFilters.maxPrice || maxValue
    ]);
    setSelectedDurations(currentFilters.duration || []);
    setSelectedRatings(currentFilters.rating || []);
    setSelectedRegions(currentFilters.region || []);
  }, [currentFilters, minValue, maxValue]);
  
  const handleSliderChange = (newValue: number | number[]) => {
    const values = Array.isArray(newValue) ? newValue : [newValue, newValue];
    setSliderValue(values);
  };
  
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? minValue : Number(e.target.value);
    const newMin = Math.max(minValue, Math.min(value, sliderValue[1] - 100));
    setSliderValue([newMin, sliderValue[1]]);
  };
  
  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? maxValue : Number(e.target.value);
    const newMax = Math.min(maxValue, Math.max(value, sliderValue[0] + 100));
    setSliderValue([sliderValue[0], newMax]);
  };
  
  const applyFilters = () => {
    const filters: Filters = {};
    
    if (sliderValue[0] !== minValue) filters.minPrice = sliderValue[0];
    if (sliderValue[1] !== maxValue) filters.maxPrice = sliderValue[1];
    if (selectedDurations.length > 0) filters.duration = selectedDurations;
    if (selectedRatings.length > 0) filters.rating = selectedRatings;
    if (selectedRegions.length > 0) filters.region = selectedRegions;
    
    onApply(filters);
  };
  
  const resetFilters = () => {
    setSliderValue([minValue, maxValue]);
    setSelectedDurations([]);
    setSelectedRatings([]);
    setSelectedRegions([]);
    onReset();
  };
  
  const hasActiveFilters = () => {
    return (
      sliderValue[0] !== minValue ||
      sliderValue[1] !== maxValue ||
      selectedDurations.length > 0 ||
      selectedRatings.length > 0 ||
      selectedRegions.length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (sliderValue[0] !== minValue || sliderValue[1] !== maxValue) count++;
    if (selectedDurations.length > 0) count++;
    if (selectedRatings.length > 0) count++;
    if (selectedRegions.length > 0) count++;
    return count;
  };

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'price':
        setSliderValue([minValue, maxValue]);
        break;
      case 'duration':
        if (value) {
          setSelectedDurations(prev => prev.filter(d => d !== value));
        }
        break;
      case 'rating':
        if (value) {
          setSelectedRatings(prev => prev.filter(r => r !== value));
        }
        break;
      case 'region':
        if (value) {
          setSelectedRegions(prev => prev.filter(r => r !== value));
        }
        break;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
            fill={star <= rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  // Auto-apply filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sliderValue, selectedDurations, selectedRatings, selectedRegions]);

  return (
    <div className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__title">
          <Filter size={20} />
          <h3>Фільтри</h3>
          {hasActiveFilters() && (
            <Badge 
              color="primary" 
              size="sm"
              className="sidebar__badge"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </div>
        
        <div className="sidebar__controls">
          {hasActiveFilters() && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={resetFilters}
              className="sidebar__reset-btn"
              aria-label="Очистити всі фільтри"
            >
              <RotateCcw size={16} />
            </Button>
          )}
          
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="sidebar__collapse-btn"
            aria-label={isCollapsed ? "Розгорнути" : "Згорнути"}
          >
            <X size={16} className={isCollapsed ? 'rotated' : ''} />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Active Filters */}
          {hasActiveFilters() && (
            <div className="sidebar__active-filters">
              <div className="active-filters__header">
                <Sparkles size={14} />
                <span>Активні фільтри</span>
              </div>
              <div className="active-filters__list">
                {(sliderValue[0] !== minValue || sliderValue[1] !== maxValue) && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    onClose={() => removeFilter('price')}
                  >
                    ₴{sliderValue[0]} - ₴{sliderValue[1]}
                  </Chip>
                )}
                {selectedRegions.map(regionId => {
                  const region = regions.find(r => r.id === regionId);
                  return region ? (
                    <Chip
                      key={regionId}
                      size="sm"
                      variant="flat"
                      color="secondary"
                      onClose={() => removeFilter('region', regionId)}
                    >
                      {region.name}
                    </Chip>
                  ) : null;
                })}
                {selectedDurations.map(duration => (
                  <Chip
                    key={duration}
                    size="sm"
                    variant="flat"
                    color="success"
                    onClose={() => removeFilter('duration', duration)}
                  >
                    {durations.find(d => d.id === duration)?.name}
                  </Chip>
                ))}
                {selectedRatings.map(rating => (
                  <Chip
                    key={rating}
                    size="sm"
                    variant="flat"
                    color="warning"
                    onClose={() => removeFilter('rating', rating)}
                  >
                    {rating}+ ★
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <Divider className="sidebar__divider" />
          
          {/* Price Range */}
          <div className="sidebar__section">
            <h4 className="sidebar__section-title">
              <span>Ціна за тур</span>
              <span className="price-range">₴{sliderValue[0]} - ₴{sliderValue[1]}</span>
            </h4>
            <div className="sidebar__slider">
              <Slider
                maxValue={maxValue}
                minValue={minValue}
                step={100}
                value={sliderValue}
                onChange={handleSliderChange}
                size="sm"
                className="sidebar__slider-control"
                color="primary"
                showTooltip={true}
                formatOptions={{
                  style: "currency",
                  currency: "UAH",
                  minimumFractionDigits: 0
                }}
              />
              <div className="sidebar__inputs">
                <Input
                  value={sliderValue[0].toString()}
                  onChange={handleMinInputChange}
                  size="sm"
                  variant="bordered"
                  startContent={<span className="currency">₴</span>}
                  label="Мінімум"
                  className="sidebar__input"
                />
                <Input
                  value={sliderValue[1].toString()}
                  onChange={handleMaxInputChange}
                  size="sm"
                  variant="bordered"
                  startContent={<span className="currency">₴</span>}
                  label="Максимум"
                  className="sidebar__input"
                />
              </div>
            </div>
          </div>

          <Divider className="sidebar__divider" />

          {/* Regions */}
          <div className="sidebar__section">
            <CheckboxGroup
              label="Регіони"
              value={selectedRegions}
              onChange={setSelectedRegions}
              className="sidebar__checkbox-group"
            >
              {regions.map(region => (
                <Checkbox 
                  key={region.id}
                  value={region.id} 
                  className="sidebar__checkbox"
                >
                  <div className="checkbox-content">
                    <span className="checkbox-label">{region.name}</span>
                    <Badge size="sm" variant="flat" color="default">
                      {region.count}
                    </Badge>
                  </div>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider className="sidebar__divider" />

          {/* Duration */}
          <div className="sidebar__section">
            <CheckboxGroup
              label="Тривалість туру"
              value={selectedDurations}
              onChange={setSelectedDurations}
              className="sidebar__checkbox-group"
            >
              {durations.map(duration => (
                <Checkbox 
                  key={duration.id}
                  value={duration.id} 
                  className="sidebar__checkbox"
                >
                  <div className="checkbox-content">
                    <span className="checkbox-label">{duration.name}</span>
                    <Badge size="sm" variant="flat" color="default">
                      {duration.count}
                    </Badge>
                  </div>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider className="sidebar__divider" />

          {/* Ratings */}
          <div className="sidebar__section">
            <CheckboxGroup
              label="Рейтинг туру"
              value={selectedRatings}
              onChange={setSelectedRatings}
              className="sidebar__checkbox-group"
            >
              {ratings.map(rating => (
                <Checkbox 
                  key={rating.id}
                  value={rating.id} 
                  className="sidebar__checkbox sidebar__checkbox--rating"
                >
                  <div className="rating-content">
                    {renderStars(rating.stars)}
                    <span className="rating-label">{rating.label}</span>
                  </div>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          {/* Actions */}
          <div className="sidebar__actions">
            <Button 
              onClick={resetFilters}
              variant="bordered"
              className="sidebar__btn sidebar__btn--reset"
              startContent={<RotateCcw size={16} />}
              isDisabled={!hasActiveFilters()}
            >
              Скинути
            </Button>
            <Button 
              onClick={applyFilters}
              color="primary"
              variant="solid"
              className="sidebar__btn sidebar__btn--apply"
              startContent={<Filter size={16} />}
              isLoading={isLoading}
            >
              Застосувати
            </Button>
          </div>
        </>
      )}
    </div>
  );
};