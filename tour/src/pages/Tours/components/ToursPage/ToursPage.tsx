import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cards } from "../Cards/Cards";
import { SearchBar } from "../SearchBar/SearchBar";
import { SideBar } from "../SideBar/SideBar";

import "./ToursPage.scss"

interface Tour {
  id: number;
  title: string;
  description: string;
  price: number;
  imageSrc: string;
}

export const ToursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<any>({});

  const { isPending, data: allTours = [] } = useQuery({
    queryKey: ["toursData"],
    queryFn: async () => {
      const res = await fetch("/api/cards");
      if (!res.ok) {
        throw new Error(`Помилка завантаження турів: ${res.status}`);
      }
      return res.json();
    },
  });

  const searchTours = async () => {
    const params = new URLSearchParams();
  
    if (searchQuery.trim()) {
      params.append("title", searchQuery);
    }
    if (filters.minPrice) {
      params.append("minPrice", String(filters.minPrice));
    }
    if (filters.maxPrice) {
      params.append("maxPrice", String(filters.maxPrice));
    }
    if (filters.duration?.length) {
      params.append("duration", filters.duration.join(","));
    }
  
    
    if (filters.rating?.length) {
      if (filters.rating.length === 1) {
        params.append("maxRating", String(filters.rating[0]));
      } else {
        const minRating = Math.min(...filters.rating);
        const maxRating = Math.max(...filters.rating);
        params.append("minRating", String(minRating));
        params.append("maxRating", String(maxRating));
      }
    }
  
    const searchUrl = `/search?${params.toString()}`;
    console.log("Запит:", searchUrl);
  
    if (!params.toString()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
  
    try {
      const res = await fetch(searchUrl);
      const ids: { id: number }[] = await res.json();
  
      if (Array.isArray(ids) && ids.length > 0) {
        const idsString = ids.map((item) => item.id).join(",");
        const detailsRes = await fetch(`/tours-search-by-ids?ids=${idsString}`);
        const tours: Tour[] = await detailsRes.json();
  
        console.log("Отримані тури після пошуку:", tours);
  
        setSearchResults(tours);
        setIsSearching(true);
      } else {
        setSearchResults([]);
        setIsSearching(true);
      }
    } catch (error) {
      console.error("Помилка під час пошуку:", error);
      setSearchResults([]);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>)=>{
    if (e.key ==="Enter"){
      searchTours();
    }
  };

  const handleSearchClear = () => {
    setSearchResults(allTours);
    setIsSearching(false);
  };

  useEffect(() => {
    const hasFilters = Object.values(filters).some(value => 
      Array.isArray(value) ? value.length > 0 : value
    );
  
    if (searchQuery.trim() || hasFilters) {
      const delaySearch = setTimeout(searchTours, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults(allTours);
      setIsSearching(false);
    }
  }, [filters, allTours]);

  return (
    <div className="ToursPage">
      <div className="ToursPage-SearchBar">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onKeyDown={handleKeyDown} onSearchClear={handleSearchClear}/>
      </div>
      <div className="ToursPage-SideBar">
        <SideBar onApply={setFilters} onReset={() => setFilters({})} />
        <div className="ToursPage-Cards">
          <Cards tours={isSearching ? searchResults : allTours} loading={isPending} />
        </div>
      </div>
    </div>
  );
};
