import React from "react";
import { Input } from "@heroui/react";
import "./SearchBar.scss";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => {
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
        onClear={()=>setSearchQuery("")}
      />
    </div>
  );
};
