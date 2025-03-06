import React from "react";
import { Input } from "@heroui/react";
import "./SearchBar.scss";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onKeyDown : (e: React.KeyboardEvent<HTMLInputElement>)=>void;
  onSearchClear : ()=>void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery,onKeyDown,onSearchClear }) => {

  const onClearSearch = () => {
    setSearchQuery("");
    onSearchClear();
  };
  return (
    <div className="search-bar-body">
      <Input
        isClearable
        fullWidth
        placeholder="Введіть запит"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={onKeyDown}
        size="lg"
        className="search-input"
        onClear={()=>onClearSearch()}
      />
    </div>
  );
};
