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

  
  const handleSliderChange = (newValue: any) => {
    setSliderValue(newValue);
  };

  const handleMinInputChange = (e: any) => {
    const newMin = Math.min(Number(e.target.value), sliderValue[1]);
    setSliderValue([newMin, sliderValue[1]]);
  };

  const handleMaxInputChange = (e: any) => {
    const newMax = Math.max(Number(e.target.value), sliderValue[0]);
    setSliderValue([sliderValue[0], newMax]);
  };

  
  const applyFilters = () => {
    onApply({
      minPrice: sliderValue[0] !== minValue ? sliderValue[0] : undefined,
      maxPrice: sliderValue[1] !== maxValue ? sliderValue[1] : undefined,
      duration: selectedDurations.length ? selectedDurations : undefined,
      rating: selectedRatings.length ? selectedRatings : undefined,
    });
  };

  
  const resetFilters = () => {
    setSliderValue([minValue, maxValue]);
    setSelectedDurations([]);
    setSelectedRatings([]);
    onReset();
  };

  return (
    <div className="SideBar">
      <div className="SideBar-Duration">
        <CheckboxGroup
          label="Оберіть тривалість"
          value={selectedDurations}
          onChange={setSelectedDurations}
        >
          <Checkbox value="5">5 днів</Checkbox>
          <Checkbox value="7">7 днів</Checkbox>
        </CheckboxGroup>
      </div>

      <div className="SideBar-Rating">
        <CheckboxGroup
          label="Оберіть рейтинг"
          value={selectedRatings}
          onChange={setSelectedRatings}
        >
          <Checkbox value="5">5</Checkbox>
          <Checkbox value="4">4</Checkbox>
          <Checkbox value="3">3</Checkbox>
          <Checkbox value="2">2</Checkbox>
          <Checkbox value="1">1</Checkbox>
        </CheckboxGroup>
      </div>

      <div className="SideBar-slider">
        <div className="SliderBar-inputs">
          <Input value={sliderValue[0].toString()} onChange={handleMinInputChange} />
          <Input value={sliderValue[1].toString()} onChange={handleMaxInputChange} />
        </div>
        <Slider
          label="Ціна"
          maxValue={maxValue}
          minValue={minValue}
          step={1}
          value={sliderValue}
          onChange={handleSliderChange}
          size="sm"
        />
      </div>


      <div className="SideBar-Actions">
        <Button onPress={resetFilters} color="default" variant="light">Відмінити</Button>
        <Button onPress={applyFilters} color="primary" variant="flat">Застосувати</Button>
      </div>
    </div>
  );
};
