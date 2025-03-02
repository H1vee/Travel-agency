import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cards } from "../Cards/Cards";
import { SearchBar } from "../SearchBar/SearchBar";

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

  
  const { isPending, data: allTours = [] } = useQuery({
    queryKey: ["toursData"],
    queryFn: async () => {
      const res = await fetch("/api/cards");
      if (!res.ok) {
        throw new Error(`Помилка завантаження турів: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Відповідь не JSON");
      }
      return res.json();
    },
  });

  
  const searchTours = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/search?title=${encodeURIComponent(query)}`);
      const ids: { id: number }[] = await res.json(); 
      console.log("Search results IDs:", ids); 
    
      if (Array.isArray(ids) && ids.length > 0) {
        const idsString = ids.map((item) => item.id).join(","); 
        const detailsRes = await fetch(`/tours-search-by-ids?ids=${idsString}`);
        const tours: Tour[] = await detailsRes.json();
        console.log("Tours from search:", tours); 
        setSearchResults(tours);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Помилка під час пошуку:", error);
      setSearchResults([]);
    }
  };
  
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchTours(searchQuery);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  return (
    <div>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div style={{ minHeight: "850px" }}>
          <Cards tours={isSearching ? searchResults : allTours} loading={isPending} />
      </div>

    </div>
  );
};
