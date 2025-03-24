import { CheckboxGroup, Checkbox, Slider, Input, Button } from "@heroui/react";
import React, { useState } from "react";
import "./SideBar.scss";

interface SideBarProps {
  onApply: (filters: any) => void;
  onReset: () => void;
}

export const SideBar: React.FC<SideBarProps> = ({ onApply, onReset }) => {
  const minValue = 0;
  const maxValue = 20000;
  const [sliderValue, setSliderValue] = useState([minValue, maxValue]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  
  const handleSliderChange = (newValue: any) => {
    setSliderValue(newValue);
  };
  
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : Number(e.target.value);
    const newMin = Math.max(minValue, Math.min(value, sliderValue[1] - 100));
    setSliderValue([newMin, sliderValue[1]]);
  };
  
  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? maxValue : Number(e.target.value);
    const newMax = Math.min(maxValue, Math.max(value, sliderValue[0] + 100));
    setSliderValue([sliderValue[0], newMax]);
  };
  
  const applyFilters = () => {
    onApply({
      minPrice: sliderValue[0] !== minValue ? sliderValue[0] : undefined,
      maxPrice: sliderValue[1] !== maxValue ? sliderValue[1] : undefined,
      duration: selectedDurations.length ? selectedDurations : undefined,
      rating: selectedRatings.length ? selectedRatings : undefined,
      region: selectedRegions.length ? selectedRegions : undefined,
    });
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

  return (
    <div className="SideBar">
      <div className="SideBar-header">
        <h3>Фільтри</h3>
        {hasActiveFilters() && (
          <button className="SideBar-reset-link" onClick={resetFilters}>
            Очистити все
          </button>
        )}
      </div>
      
      <div className="SideBar-section">
        <h4 className="SideBar-section-title">Ціна (₴)</h4>
        <div className="SideBar-slider">
          <Slider
            maxValue={maxValue}
            minValue={minValue}
            step={100}
            value={sliderValue}
            onChange={handleSliderChange}
            size="sm"
            className="SideBar-slider-control"
          />
          <div className="SideBar-inputs">
            <div className="SideBar-input-group">
              <label>Від</label>
              <Input 
                value={sliderValue[0].toString()} 
                onChange={handleMinInputChange}
                size="sm"
                className="SideBar-input"
                aria-label="Мінімальна ціна"
              />
            </div>
            <div className="SideBar-input-group">
              <label>До</label>
              <Input 
                value={sliderValue[1].toString()} 
                onChange={handleMaxInputChange}
                size="sm"
                className="SideBar-input"
                aria-label="Максимальна ціна"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="SideBar-section">
        <CheckboxGroup
          label="Регіон"
          value={selectedRegions}
          onChange={setSelectedRegions}
          className="SideBar-checkbox-group"
        >
          <Checkbox value="1" className="SideBar-checkbox">Європа</Checkbox>
          <Checkbox value="2" className="SideBar-checkbox">Азія</Checkbox>
          <Checkbox value="3" className="SideBar-checkbox">Америка</Checkbox>
          <Checkbox value="4" className="SideBar-checkbox">Африка</Checkbox>
          <Checkbox value="5" className="SideBar-checkbox">Океанія</Checkbox>
        </CheckboxGroup>
      </div>

      <div className="SideBar-section">
        <CheckboxGroup
          label="Тривалість туру"
          value={selectedDurations}
          onChange={setSelectedDurations}
          className="SideBar-checkbox-group"
        >
          <Checkbox value="5" className="SideBar-checkbox">5 днів</Checkbox>
          <Checkbox value="7" className="SideBar-checkbox">7 днів</Checkbox>
          <Checkbox value="10" className="SideBar-checkbox">10 днів</Checkbox>
        </CheckboxGroup>
      </div>

      <div className="SideBar-section">
        <CheckboxGroup
          label="Рейтинг туру"
          value={selectedRatings}
          onChange={(newRatings) => {
            if (newRatings.length <= 2) {
              setSelectedRatings(newRatings);
            }
          }}
          className="SideBar-checkbox-group"
        >
          <div className="SideBar-ratings">
            <Checkbox value="5" className="SideBar-checkbox">
              <div className="SideBar-rating">
                <span className="stars">★★★★★</span>
              </div>
            </Checkbox>
            <Checkbox value="4" className="SideBar-checkbox">
              <div className="SideBar-rating">
                <span className="stars">★★★★</span><span className="empty-stars">★</span>
              </div>
            </Checkbox>
            <Checkbox value="3" className="SideBar-checkbox">
              <div className="SideBar-rating">
                <span className="stars">★★★</span><span className="empty-stars">★★</span>
              </div>
            </Checkbox>
            <Checkbox value="2" className="SideBar-checkbox">
              <div className="SideBar-rating">
                <span className="stars">★★</span><span className="empty-stars">★★★</span>
              </div>
            </Checkbox>
            <Checkbox value="1" className="SideBar-checkbox">
              <div className="SideBar-rating">
                <span className="stars">★</span><span className="empty-stars">★★★★</span>
              </div>
            </Checkbox>
          </div>
        </CheckboxGroup>
      </div>

      <div className="SideBar-actions">
        <Button 
          onPress={resetFilters} 
          color="default" 
          variant="bordered"
          className="SideBar-btn-reset"
        >
          Відмінити
        </Button>
        <Button 
          onPress={applyFilters} 
          color="primary" 
          variant="solid"
          className="SideBar-btn-apply"
        >
          Застосувати
        </Button>
      </div>
    </div>
  );
};