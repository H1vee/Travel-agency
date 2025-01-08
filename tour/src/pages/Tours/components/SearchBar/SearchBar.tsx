import React, { useState } from "react";
import { Input, Button, Spacer, Card, Select, SelectItem } from "@nextui-org/react";
import "./SearchBar.scss";

export const countries = [
    {key: "taiwan", label: "Тайвань"},
    {key: "egypt", label: "Єгипет"},
    {key:"boston",label:"Бостон"},
    {key:"maldives",label:"Мальдіви"}
  ];
  
  

export const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
      <div className="search-bar-body">
        <Input
          isClearable
          fullWidth
          placeholder="Введіть запит"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="lg"
          className="search-input"
        />
      </div>
  );
};