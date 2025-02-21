import {CheckboxGroup, Checkbox, Slider, SliderValue, Input, divider} from "@heroui/react";
import "./SideBar.scss";
import React from "react";

export const SideBar =()=>{
    const minValue = 0
    const maxValue = 20000
    const [sliderValue, setSliderValue] = React.useState([minValue, maxValue]);
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
    return(
        
        <div className="SideBar">
        <CheckboxGroup label="Оберіть тур">
        <Checkbox value="buenos-aires">Buenos Aires</Checkbox>
        <Checkbox value="sydney">Sydney</Checkbox>
        <Checkbox value="san-francisco">San Francisco</Checkbox>
        <Checkbox value="london">London</Checkbox>
        <Checkbox value="tokyo">Tokyo</Checkbox>
      </CheckboxGroup>
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
      </div>
    </div>
    );
}