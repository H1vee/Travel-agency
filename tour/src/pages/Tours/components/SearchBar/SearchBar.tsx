import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  Input, 
  Button, 
  Chip, 
  Card, 
  CardBody,
  Spinner,
  Kbd
} from "@heroui/react";
import { 
  Search, 
  X, 
  TrendingUp, 
  Clock, 
  MapPin
} from "lucide-react";
import "./SearchBar.scss";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchClear: () => void;
  isLoading?: boolean;
  popularSearches?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchClear,
  isLoading = false,
  popularSearches = []
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    
    try {
      const updated = [
        query.trim(),
        ...recentSearches.filter(item => item !== query.trim())
      ].slice(0, 5); // Keep only 5 recent searches
      
      setRecentSearches(updated);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }, [recentSearches]);

  // Handle search input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, [setSearchQuery]);

  // Handle search submission
  const handleSearch = useCallback((query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      saveToRecentSearches(searchTerm.trim());
      setSearchQuery(searchTerm.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [searchQuery, setSearchQuery, saveToRecentSearches]);

  // Handle clear search
  const handleClear = useCallback(() => {
    setSearchQuery("");
    onSearchClear();
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [setSearchQuery, onSearchClear]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [handleSearch]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't close suggestions if clicking inside suggestions
    if (suggestionsRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSearch(suggestion);
  }, [handleSearch]);

  // Remove from recent searches
  const removeFromRecentSearches = useCallback((query: string) => {
    try {
      const updated = recentSearches.filter(item => item !== query);
      setRecentSearches(updated);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to remove recent search:', error);
    }
  }, [recentSearches]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-bar">
      <div className={`search-bar__wrapper ${isFocused ? 'search-bar__wrapper--focused' : ''}`}>
        <div className="search-bar__input-container">
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Шукайте тури за назвою, країною, містом..."
            size="lg"
            variant="bordered"
            classNames={{
              base: "search-bar__input-base",
              mainWrapper: "search-bar__input-wrapper",
              input: "search-bar__input",
              inputWrapper: "search-bar__input-inner"
            }}
            startContent={
              <div className="search-bar__start-content">
                <Search size={20} className="search-icon" />
              </div>
            }
            endContent={
              <div className="search-bar__end-content">
                {isLoading && (
                  <Spinner size="sm" className="search-spinner" />
                )}
                {searchQuery && !isLoading && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={handleClear}
                    className="clear-button"
                    aria-label="Очистити пошук"
                  >
                    <X size={16} />
                  </Button>
                )}
                <div className="search-shortcut">
                  <Kbd keys={["enter"]}>Enter</Kbd>
                </div>
              </div>
            }
          />
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (
          <Card 
            ref={suggestionsRef}
            className="search-bar__suggestions"
            shadow="lg"
          >
            <CardBody className="search-bar__suggestions-body">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-section__header">
                    <Clock size={16} />
                    <span>Останні пошуки</span>
                  </div>
                  <div className="suggestions-section__items">
                    {recentSearches.map((search, index) => (
                      <div
                        key={`recent-${index}`}
                        className="suggestion-item suggestion-item--recent"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        <Clock size={14} className="suggestion-icon" />
                        <span className="suggestion-text">{search}</span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromRecentSearches(search);
                          }}
                          className="suggestion-remove"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-section__header">
                    <TrendingUp size={16} />
                    <span>Популярні напрямки</span>
                  </div>
                  <div className="suggestions-section__items">
                    {popularSearches.map((search, index) => (
                      <div
                        key={`popular-${index}`}
                        className="suggestion-item suggestion-item--popular"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        <MapPin size={14} className="suggestion-icon" />
                        <span className="suggestion-text">{search}</span>
                        <TrendingUp size={12} className="suggestion-trend" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Tips */}
              <div className="suggestions-section suggestions-section--tips">
                <div className="search-tips">
                  <h4>💡 Поради для пошуку:</h4>
                  <ul>
                    <li>Спробуйте назву країни або міста</li>
                    <li>Використовуйте ключові слова типу "пляж", "гори"</li>
                    <li>Поєднуйте пошук з фільтрами для кращих результатів</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Search Results Count */}
      {searchQuery && (
        <div className="search-bar__info">
          <div className="search-info">
            <Search size={14} />
            <span>Результати для:</span>
            <Chip size="sm" variant="flat" color="primary">
              "{searchQuery}"
            </Chip>
          </div>
        </div>
      )}
    </div>
  );
};