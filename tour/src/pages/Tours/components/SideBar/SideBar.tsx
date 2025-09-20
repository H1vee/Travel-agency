import { CheckboxGroup, Checkbox, Slider, Input, Button, Badge, Divider, Chip } from "@heroui/react";
import React, { useState, useEffect, useCallback } from "react";
import { Filter, X, RotateCcw, Sparkles, Star } from "lucide-react";
import { Filters, PriceRange, REGIONS, DURATIONS, RATINGS } from "../../../../types/tours";
import "./SideBar.scss";

interface SideBarProps {
  onApply: (filters: Filters) => void;
  onReset: () => void;
  isLoading?: boolean;
  currentFilters?: Filters;
  priceRange?: PriceRange;
}

export const SideBar: React.FC<SideBarProps> = ({ 
  onApply, 
  onReset, 
  isLoading = false, 
  currentFilters = {},
  priceRange = { min: 0, max: 100000 }
}) => {
  const { min: minValue, max: maxValue } = priceRange;
  
  // Local state
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
  
  // Filter options - використовуємо з спільного файлу типів
  const regions = REGIONS;
  const durations = DURATIONS;
  const ratings = RATINGS;

  // Update local state when currentFilters or priceRange change
  useEffect(() => {
    setSliderValue([
      currentFilters.minPrice || minValue,
      currentFilters.maxPrice || maxValue
    ]);
    setSelectedDurations(currentFilters.duration || []);
    setSelectedRatings(currentFilters.rating || []);
    setSelectedRegions(currentFilters.region || []);
  }, [currentFilters, minValue, maxValue]);

  // Update slider when price range changes
  useEffect(() => {
    if (priceRange.min !== minValue || priceRange.max !== maxValue) {
      setSliderValue([
        Math.max(sliderValue[0], minValue),
        Math.min(sliderValue[1], maxValue)
      ]);
    }
  }, [priceRange, minValue, maxValue]);
  
  const handleSliderChange = useCallback((newValue: number | number[]) => {
    const values = Array.isArray(newValue) ? newValue : [newValue, newValue];
    setSliderValue(values);
  }, []);
  
  const handleMinInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? minValue : Number(e.target.value);
    const newMin = Math.max(minValue, Math.min(value, sliderValue[1] - 100));
    setSliderValue([newMin, sliderValue[1]]);
  }, [sliderValue, minValue]);
  
  const handleMaxInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? maxValue : Number(e.target.value);
    const newMax = Math.min(maxValue, Math.max(value, sliderValue[0] + 100));
    setSliderValue([sliderValue[0], newMax]);
  }, [sliderValue, maxValue]);
  
  const applyFilters = useCallback(() => {
    const filters: Filters = {};
    
    // Ціна - відправляємо тільки якщо значення відрізняються від дефолтних
    if (sliderValue[0] > minValue) filters.minPrice = sliderValue[0];
    if (sliderValue[1] < maxValue) filters.maxPrice = sliderValue[1];
    if (selectedDurations.length > 0) filters.duration = selectedDurations;
    if (selectedRatings.length > 0) filters.rating = selectedRatings;
    if (selectedRegions.length > 0) filters.region = selectedRegions;
    
    console.log("🔧 SideBar: Застосовуємо фільтри для сервера:", filters);
    console.log("🔧 Діапазон цін:", { min: minValue, max: maxValue, current: sliderValue });
    onApply(filters);
  }, [sliderValue, selectedDurations, selectedRatings, selectedRegions, minValue, maxValue, onApply]);
  
  const resetFilters = useCallback(() => {
    console.log("🔄 SideBar: Скидання фільтрів");
    setSliderValue([minValue, maxValue]);
    setSelectedDurations([]);
    setSelectedRatings([]);
    setSelectedRegions([]);
    onReset();
  }, [minValue, maxValue, onReset]);
  
  const hasActiveFilters = useCallback(() => {
    return (
      sliderValue[0] > minValue ||
      sliderValue[1] < maxValue ||
      selectedDurations.length > 0 ||
      selectedRatings.length > 0 ||
      selectedRegions.length > 0
    );
  }, [sliderValue, selectedDurations, selectedRatings, selectedRegions, minValue, maxValue]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (sliderValue[0] > minValue || sliderValue[1] < maxValue) count++;
    if (selectedDurations.length > 0) count++;
    if (selectedRatings.length > 0) count++;
    if (selectedRegions.length > 0) count++;
    return count;
  }, [sliderValue, selectedDurations, selectedRatings, selectedRegions, minValue, maxValue]);

  const removeFilter = useCallback((type: string, value?: string) => {
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
  }, [minValue, maxValue]);

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
  }, [applyFilters]);

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

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
                {(sliderValue[0] > minValue || sliderValue[1] < maxValue) && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    onClose={() => removeFilter('price')}
                  >
                    ₴{formatPrice(sliderValue[0])} - ₴{formatPrice(sliderValue[1])}
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
              <span className="price-range">
                ₴{formatPrice(sliderValue[0])} - ₴{formatPrice(sliderValue[1])}
              </span>
            </h4>
            <div className="sidebar__slider">
              <Slider
                maxValue={maxValue}
                minValue={minValue}
                step={Math.max(1000, Math.floor((maxValue - minValue) / 100))}
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
              
              <div className="sidebar__price-inputs">
                <Input
                  type="number"
                  label="Від"
                  value={sliderValue[0].toString()}
                  onChange={handleMinInputChange}
                  min={minValue}
                  max={sliderValue[1] - 100}
                  size="sm"
                  variant="bordered"
                  startContent="₴"
                  className="price-input"
                />
                <Input
                  type="number"
                  label="До"
                  value={sliderValue[1].toString()}
                  onChange={handleMaxInputChange}
                  min={sliderValue[0] + 100}
                  max={maxValue}
                  size="sm"
                  variant="bordered"
                  startContent="₴"
                  className="price-input"
                />
              </div>
            </div>
          </div>

          <Divider className="sidebar__divider" />

          {/* Regions */}
          <div className="sidebar__section">
            <h4 className="sidebar__section-title">Регіон</h4>
            <CheckboxGroup
              value={selectedRegions}
              onValueChange={setSelectedRegions}
              size="sm"
              className="sidebar__checkbox-group"
            >
              {regions.map((region) => (
                <Checkbox 
                  key={region.id} 
                  value={region.id}
                  className="sidebar__checkbox"
                >
                  {region.name}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider className="sidebar__divider" />

          {/* Duration */}
          <div className="sidebar__section">
            <h4 className="sidebar__section-title">Тривалість</h4>
            <CheckboxGroup
              value={selectedDurations}
              onValueChange={setSelectedDurations}
              size="sm"
              className="sidebar__checkbox-group"
            >
              {durations.map((duration) => (
                <Checkbox 
                  key={duration.id} 
                  value={duration.id}
                  className="sidebar__checkbox"
                >
                  {duration.name}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider className="sidebar__divider" />

          {/* Rating */}
          <div className="sidebar__section">
            <h4 className="sidebar__section-title">Рейтинг</h4>
            <CheckboxGroup
              value={selectedRatings}
              onValueChange={setSelectedRatings}
              size="sm"
              className="sidebar__checkbox-group"
            >
              {ratings.map((rating) => (
                <Checkbox 
                  key={rating.id} 
                  value={rating.id}
                  className="sidebar__checkbox sidebar__checkbox--rating"
                >
                  <div className="rating-option">
                    {renderStars(rating.stars)}
                    <span className="rating-label">{rating.label}</span>
                  </div>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          {/* Footer Actions */}
          <div className="sidebar__footer">
            <Button
              color="primary"
              onClick={applyFilters}
              isDisabled={isLoading}
              className="sidebar__apply-btn"
              fullWidth
            >
              {isLoading ? "Застосовується..." : "Застосувати фільтри"}
            </Button>
            
            {hasActiveFilters() && (
              <Button
                variant="light"
                color="danger"
                onClick={resetFilters}
                startContent={<RotateCcw size={16} />}
                className="sidebar__reset-all-btn"
                fullWidth
              >
                Скинути всі фільтри
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};