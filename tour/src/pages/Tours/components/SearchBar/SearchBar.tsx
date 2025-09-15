import React, { useState, useRef, useEffect } from "react";
import { Input, Kbd, Spinner } from "@heroui/react";
import { Search, X, Sparkles, Clock } from "lucide-react";
import "./SearchBar.scss";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchClear: () => void;
  placeholder?: string;
  isLoading?: boolean;
  popularSearches?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchClear,
  placeholder = "Шукайте тури за назвою, містом, країною...",
  isLoading = false,
  popularSearches = ["Єгипет", "Дубай", "Бостон", "Мальдіви", "Тайвань"]
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const onClearSearch = () => {
    setSearchQuery("");
    onSearchClear();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (search: string) => {
    setSearchQuery(search);
    saveRecentSearch(search);
    setIsFocused(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
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
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
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
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-header">
                    <Clock size={16} />
                    <span>Нещодавні пошуки</span>
                    <button 
                      className="clear-recent-btn"
                      onClick={clearRecentSearches}
                    >
                      Очистити
                    </button>
                  </div>
                  <div className="suggestions-list">
                    {recentSearches.map((search, index) => (
                      <button
                        key={`recent-${index}`}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        <Clock size={14} />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div className="suggestions-section">
                <div className="suggestions-header">
                  <Sparkles size={16} />
                  <span>Популярні напрямки</span>
                </div>
                <div className="suggestions-list">
                  {popularSearches.map((search, index) => (
                    <button
                      key={`popular-${index}`}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <Search size={14} />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
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