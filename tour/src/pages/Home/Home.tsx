import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { CarCard } from '../../components/CarCard/CarCard';
import { InquiryModal } from '../../components/InquiryModal/InquiryModal';
import { carService } from '../../services/CarService';
import { CarCard as CarCardType } from '../../types/cars';
import './Home.scss';

export const Home: React.FC = () => {
  const [cars, setCars] = useState<CarCardType[]>([]);
  const [stats, setStats] = useState<{ totalCars: number; totalBrands: number } | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    carService.getSwiper().then(setCars).catch(() => setCars([]));
    fetch(`${process.env.REACT_APP_API_URL || ''}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="hero__content">
          <h1>Ваш наступний автомобіль — під ключ</h1>
          <p>
            Підбираємо, перевіряємо та пригоняємо авто з Європи та США. Прозоро,
            з гарантією технічного стану й повним супроводом.
          </p>
          <div className="hero__actions">
            <Link to="/catalog" className="hero__btn primary">
              Переглянути каталог
            </Link>
            <button className="hero__btn" onClick={() => setAskOpen(true)}>
              Поставити запитання
            </button>
          </div>
          {stats && (
            <div className="hero__stats">
              <div>
                <strong>{stats.totalCars}</strong>
                <span>авто в наявності</span>
              </div>
              <div>
                <strong>{stats.totalBrands}</strong>
                <span>марок</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <h2>Нові надходження</h2>
          <Link to="/catalog">Усі авто →</Link>
        </div>
        {cars.length === 0 ? (
          <p className="home-section__empty">Скоро тут з'являться автомобілі.</p>
        ) : (
          <div className="home-section__grid">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      <section className="home-cta">
        <h2>Не знайшли потрібне авто?</h2>
        <p>Залиште заявку — ми підберемо автомобіль під ваш бюджет та побажання.</p>
        <button className="home-cta__btn" onClick={() => setAskOpen(true)}>
          Залишити заявку
        </button>
      </section>

      <InquiryModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        requestType="question"
      />

      <Footer />
    </>
  );
};
