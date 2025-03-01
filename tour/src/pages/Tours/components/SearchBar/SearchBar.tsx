import React, { useState } from "react";
import { Input, Button, Spacer, Card, Select, SelectItem } from "@heroui/react";
import "./SearchBar.scss";

interface SearchBarProps {
  setSearchQuery: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ setSearchQuery }) => {
  return (
    <div className="search-bar-body">
      <Input
        isClearable
        fullWidth
        placeholder="Введіть запит"
        onChange={(e) => setSearchQuery(e.target.value)}
        size="lg"
        className="search-input"
      />
    </div>
  );
};