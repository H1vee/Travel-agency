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

  // Запрос всех туров (если нет поиска)
  const { isPending, data: allTours = [] } = useQuery({
    queryKey: ["toursData"],
    queryFn: async () => {
      const res = await fetch("/api/cards");
      if (!res.ok) {
        throw new Error(`Ошибка загрузки туров: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Ответ не JSON");
      }
      return res.json();
    },
  });

  // Функция поиска туров
  const searchTours = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/search?title=${encodeURIComponent(query)}`);
      const ids: { id: number }[] = await res.json(); // Убедитесь, что ids - это массив объектов с полем id
      console.log("Search results IDs:", ids); // Логируем результаты поиска
    
      if (Array.isArray(ids) && ids.length > 0) {
        const idsString = ids.map((item) => item.id).join(","); // Преобразуем массив объектов в строку чисел
        const detailsRes = await fetch(`/tours-search-by-ids?ids=${idsString}`);
        const tours: Tour[] = await detailsRes.json();
        console.log("Tours from search:", tours); // Логируем подробности туров
        setSearchResults(tours);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Помилка під час пошуку:", error);
      setSearchResults([]);
    }
  };
  // Запускаем поиск при изменении `searchQuery` (debounce можно добавить)
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchTours(searchQuery);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  return (
    <div>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Cards tours={isSearching ? searchResults : allTours} loading={isPending} />
    </div>
  );
};
