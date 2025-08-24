import React, { useState, useRef } from "react";
import { Input, Kbd, Spinner } from "@heroui/react";
import { Search, X, Sparkles } from "lucide-react";
import "./SearchBar.scss";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  placeholder?: string;
  isLoading?: boolean;
  popularSearches?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onKeyDown,
  onSearchClear,
  placeholder = "Шукайте тури, міста, країни...",
  isLoading = false,
  popularSearches = ["Карпати", "Київ", "Львів", "Одеса", "Європа"]
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onClearSearch = () => {
    setSearchQuery("");
    onSearchClear();
    inputRef.current?.focus();
  };

  const handlePopularSearchClick = (search: string) => {
    setSearchQuery(search);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
    onKeyDown(e);
  };

  return (
    <div className="search-container">
      <div className={`search-bar ${isFocused ? 'search-bar--focused' : ''} ${searchQuery ? 'search-bar--has-value' : ''}`}>
        <div className="search-icon">
          {isLoading ? (
            <Spinner size="sm" color="primary" />
          ) : (
            <Search size={20} />
          )}
        </div>

        <div className="search-input-container">
          <Input
            ref={inputRef}
            fullWidth
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            size="lg"
            variant="flat"
            className="search-input"
            classNames={{
              inputWrapper: "search-input-wrapper",
              innerWrapper: "search-inner-wrapper",
              input: "search-input-field"
            }}
            endContent={
              <>
                {searchQuery && (
                  <button
                    className="search-clear-button"
                    onClick={onClearSearch}
                    aria-label="Очистити пошук"
                  >
                    <X size={18} />
                  </button>
                )}
                <div className="search-shortcut">
                  <Kbd keys={["command"]}>K</Kbd>
                </div>
              </>
            }
          />
        </div>

        {isFocused && !searchQuery && (
          <div className="search-dropdown">
            <div className="search-suggestions">
              <div className="suggestions-header">
                <Sparkles size={16} />
                <span>Популярні напрямки</span>
              </div>
              <div className="suggestions-list">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    className="suggestion-item"
                    onClick={() => handlePopularSearchClick(search)}
                  >
                    <Search size={14} />
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {searchQuery && (
        <div className="search-info">
          <div className="search-info-content">
            <span>Результати пошуку для:</span>
            <span className="search-query">"{searchQuery}"</span>
          </div>
        </div>
      )}
    </div>
  );
};