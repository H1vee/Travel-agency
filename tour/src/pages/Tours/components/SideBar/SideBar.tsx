import {CheckboxGroup, Checkbox, Slider, SliderValue, Input, Button} from "@heroui/react";
import React from "react";
import { useState } from "react";

import "./SideBar.scss";



interface SideBarProps{
  onApply: (filters:any) => void;
  onReset : ( )=> void;
}

export const SideBar:React.FC<SideBarProps> =({onApply,onReset})=>{
    const minValue = 0
    const maxValue = 20000
    const [sliderValue, setSliderValue] = React.useState([minValue, maxValue]);
    const [duration, setDuration] = useState<string[]>([]);
    const [rating, setRating] = useState<string[]>([]);
    const handleSliderChange = (newValue:any) => {
        setSliderValue(newValue);
      };
    

      const handleMinInputChange = (e:any) => {
        const newMin = Math.min(Number(e.target.value), sliderValue[1]);
        setSliderValue([newMin, sliderValue[1]]);
      };
    
      const handleMaxInputChange = (e:any) => {
        const newMax = Math.max(Number(e.target.value), sliderValue[0]);
        setSliderValue([sliderValue[0], newMax]);
      };

      const handleApply = ()=>{
        onApply({
          minPrice : sliderValue[0],
          maxPrice : sliderValue[1],
          duration,
          rating
        });
      };

      const handleReset = ()=>{
        setSliderValue([minValue,maxValue]);
        setDuration([]);
        setRating([]);
        onReset();
      };
      
    return(
        
        <div className="SideBar">
          <div className="SideBar-Duration">
            <CheckboxGroup label="Оберіть тривалість">
              <Checkbox value="buenos-aires">5 днів</Checkbox>
              <Checkbox value="sydney">7 днів</Checkbox>
            </CheckboxGroup>
          </div>

          <div className="SideBar-Rating">
            <CheckboxGroup label="Оберіть рейтинг">
              <Checkbox value="5">5</Checkbox>
              <Checkbox value="4">4</Checkbox>
              <Checkbox value="3">3</Checkbox>
              <Checkbox value="2">2</Checkbox>
              <Checkbox value="1">1</Checkbox>
            </CheckboxGroup>
          </div>

      <div className="SideBar-slider">
        <div className="SliderBar-inputs">
            <Input
                endContent={
                    <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">₴</span>
                    </div>
                    }
            value={sliderValue[0].toString()}
            onChange={handleMinInputChange}
            />
            <Input
                endContent={
                    <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">₴</span>
                    </div>
                    }
              value={sliderValue[1].toString()}
              onChange={handleMaxInputChange}
            />
        </div>
        <Slider
          label="Ціна"
          maxValue={maxValue}
          minValue={minValue}
          step={0.01}
          size="sm"
          formatOptions={{style: "currency", currency: "UAH"}}
          value={sliderValue}
          onChange={handleSliderChange}
        />

        <div className="SideBar-buttons">
        <Button onPress={handleApply} color="primary">
          Застосувати
        </Button>
        <Button onPress={handleReset} color="danger" variant="flat">
          Відмінити
        </Button>
        </div>

      </div>
    </div>
    );
}