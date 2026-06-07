import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { CarCard } from '../../components/CarCard/CarCard';
import { carService } from '../../services/CarService';
import {
  CarFilters,
  FilterOptions,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  DRIVE_LABELS,
  SORT_LABELS,
  SearchResponse,
  SortOption,
  label,
} from '../../types/cars';
import './Catalog.scss';

const EMPTY: CarFilters = { page: 1, limit: 12, sortBy: 'newest' };

export const Catalog: React.FC = () => {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState<CarFilters>(EMPTY);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carService.getFilterOptions().then(setOptions).catch(() => setOptions(null));
  }, []);

  const runSearch = useCallback(async (f: CarFilters) => {
    setLoading(true);
    try {
      setData(await carService.search(f));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(filters);
  }, [filters, runSearch]);

  // Toggle a value inside a multi-select array filter and reset to page 1.
  const toggleMulti = (key: keyof CarFilters, value: string) => {
    setFilters((prev) => {
      const arr = (prev[key] as string[] | undefined) || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next, page: 1 };
    });
  };

  const setRange = (key: keyof CarFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : Number(value),
      page: 1,
    }));
  };

  const isChecked = (key: keyof CarFilters, value: string) =>
    ((filters[key] as string[] | undefined) || []).includes(value);

  const resetAll = () => setFilters(EMPTY);

  const CheckGroup = ({
    title,
    field,
    values,
    labels,
  }: {
    title: string;
    field: keyof CarFilters;
    values: string[];
    labels?: Record<string, string>;
  }) =>
    values.length === 0 ? null : (
      <div className="filter-group">
        <h4>{title}</h4>
        <div className="filter-group__items">
          {values.map((v) => (
            <label key={v} className="filter-check">
              <input
                type="checkbox"
                checked={isChecked(field, v)}
                onChange={() => toggleMulti(field, v)}
              />
              <span>{labels ? label(labels, v) : v}</span>
            </label>
          ))}
        </div>
      </div>
    );

  const RangeRow = ({
    title,
    minKey,
    maxKey,
    suffix,
  }: {
    title: string;
    minKey: keyof CarFilters;
    maxKey: keyof CarFilters;
    suffix?: string;
  }) => (
    <div className="filter-group">
      <h4>{title}</h4>
      <div className="filter-range">
        <input
          type="number"
          placeholder="від"
          value={(filters[minKey] as number) ?? ''}
          onChange={(e) => setRange(minKey, e.target.value)}
        />
        <input
          type="number"
          placeholder="до"
          value={(filters[maxKey] as number) ?? ''}
          onChange={(e) => setRange(maxKey, e.target.value)}
        />
        {suffix && <span className="filter-range__suffix">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="catalog">
        <aside className="catalog__filters">
          <div className="catalog__filters-head">
            <h2>Фільтри</h2>
            <button onClick={resetAll}>Скинути</button>
          </div>

          {options && (
            <>
              <CheckGroup title="Марка" field="make" values={options.makes} />
              <CheckGroup title="Тип кузова" field="bodyType" values={options.bodyTypes} />
              <CheckGroup
                title="Тип палива"
                field="fuelType"
                values={options.fuelTypes}
                labels={FUEL_LABELS}
              />
              <RangeRow title="Рік випуску" minKey="minYear" maxKey="maxYear" />
              <RangeRow title="Ціна, $" minKey="minPrice" maxKey="maxPrice" />
              <RangeRow title="Пробіг" minKey="minMileage" maxKey="maxMileage" suffix="км" />
              <RangeRow title="Об'єм двигуна" minKey="minEngine" maxKey="maxEngine" suffix="л" />
              <RangeRow
                title="Ємність батареї"
                minKey="minBattery"
                maxKey="maxBattery"
                suffix="кВт"
              />
              <CheckGroup
                title="Коробка передач"
                field="transmission"
                values={options.transmissions}
                labels={TRANSMISSION_LABELS}
              />
              <CheckGroup
                title="Привід"
                field="drive"
                values={options.drives}
                labels={DRIVE_LABELS}
              />
              <CheckGroup
                title="Кількість місць"
                field="seats"
                values={options.seats.map(String)}
              />
            </>
          )}
        </aside>

        <main className="catalog__results">
          <div className="catalog__toolbar">
            <input
              className="catalog__search"
              type="text"
              placeholder="Пошук за маркою, моделлю…"
              value={filters.q || ''}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value, page: 1 }))}
            />
            <select
              className="catalog__sort"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((p) => ({ ...p, sortBy: e.target.value as SortOption, page: 1 }))
              }
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <p className="catalog__count">
            {data ? `Знайдено автомобілів: ${data.total}` : ' '}
          </p>

          {loading ? (
            <div className="catalog__state">Завантаження…</div>
          ) : !data || data.cars.length === 0 ? (
            <div className="catalog__state">Автомобілів за вашим запитом не знайдено.</div>
          ) : (
            <div className="catalog__grid">
              {data.cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="catalog__pagination">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === data.page ? 'active' : ''}
                  onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};
