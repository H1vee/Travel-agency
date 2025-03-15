import React from "react";
import { Input } from "@heroui/react";
import { Search, X } from "lucide-react";
import "./SearchBar.scss";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  onKeyDown, 
  onSearchClear, 
  placeholder = "Пошук турів..."
}) => {
  const onClearSearch = () => {
    setSearchQuery("");
    onSearchClear();
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <div className="search-icon">
          <Search size={18} />
        </div>
        <Input
         // isClearable
          fullWidth
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onKeyDown}
          size="lg"
          className="search-input"
         // onClear={onClearSearch}
          aria-label="Пошук"
          classNames={{
            inputWrapper: "search-input-wrapper",
            innerWrapper: "search-inner-wrapper",
            clearButton: "search-clear-button"
          }}
        />
        {searchQuery && (
          <button 
            className="search-clear-button" 
            onClick={onClearSearch}
            aria-label="Очистити пошук"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {searchQuery && (
        <div className="search-info">
          <span>Результати пошуку для: <strong>"{searchQuery}"</strong></span>
        </div>
      )}
    </div>
  );
};