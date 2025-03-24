import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cards } from "../Cards/Cards";
import { SearchBar } from "../SearchBar/SearchBar";
import { SideBar } from "../SideBar/SideBar";
import { Pagination } from "@heroui/react";
import "./ToursPage.scss";

interface Tour {
  id: number;
  title: string;
  description: string;
  price: number;
  imageSrc: string;
}

interface SearchTour {
  id: number;
}

export const ToursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<any>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); 

  const { isPending, data: allTours = [] } = useQuery({
    queryKey: ["toursData"],
    queryFn: async () => {
      const res = await fetch("/api/cards");
      if (!res.ok) {
        throw new Error(`Error loading tours: ${res.status}`);
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
    
    // Add region parameter to search
    if (filters.region?.length) {
      params.append("region", filters.region.join(","));
    }
  
    const searchUrl = `/search?${params.toString()}`;
    console.log("Search Query:", searchUrl);
  
    if (!params.toString()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
  
    try {
      const res = await fetch(searchUrl);
      const searchTours: SearchTour[] = await res.json();
  
      if (Array.isArray(searchTours) && searchTours.length > 0) {
        const idsString = searchTours.map((item) => item.id).join(",");
        const detailsRes = await fetch(`/tours-search-by-ids?ids=${idsString}`);
        const tours: Tour[] = await detailsRes.json();
  
        console.log("Received tours after search:", tours);
  
        setSearchResults(tours);
        setIsSearching(true);
      } else {
        setSearchResults([]);
        setIsSearching(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchTours();
    }
  };

  const handleSearchClear = () => {
    setSearchResults(allTours);
    setIsSearching(false);
  };

  useEffect(() => {
    const hasFilters = Object.values(filters).some((value) =>
      Array.isArray(value) ? value.length > 0 : value
    );
  
    if (searchQuery.trim() || hasFilters) {
      const delaySearch = setTimeout(searchTours, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults(allTours);
      setIsSearching(false);
    }
  }, [filters, searchQuery, allTours]);

  const indexOfLastTour = currentPage * itemsPerPage;
  const indexOfFirstTour = indexOfLastTour - itemsPerPage;
  const currentTours = (isSearching ? searchResults : allTours).slice(indexOfFirstTour, indexOfLastTour);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="ToursPage">
      <div className="ToursPage-SearchBar">
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onKeyDown={handleKeyDown} 
          onSearchClear={handleSearchClear} 
        />
      </div>
      <div className="ToursPage-SideBar">
        <SideBar 
          onApply={setFilters} 
          onReset={() => setFilters({})} 
        />
        <div className="ToursPage-Cards">
          <Cards tours={currentTours} loading={isPending} />
        </div>
      </div>
      
      <div className="ToursPage-Pagination">
        <Pagination
          initialPage={1}
          total={Math.ceil((isSearching ? searchResults.length : allTours.length) / itemsPerPage)}
          onChange={handlePageChange}
          showControls
          loop
          showShadow
          size="md"
        />
      </div>
    </div>
  );
};