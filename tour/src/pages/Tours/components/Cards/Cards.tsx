import React from "react";
import { Card, CardFooter, Image } from "@heroui/react";
import { Link } from "react-router-dom";

import "./Cards.scss";

interface Tour {
  id: number;
  title: string;
  description: string;
  price: number;
  imageSrc: string;
}

interface CardsProps {
  tours: Tour[];
  loading: boolean;
}

export const Cards: React.FC<CardsProps> = ({ tours, loading }) => {
  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading tours...</p>
    </div>
  );

  if (!Array.isArray(tours)) return (
    <div className="error-message">
      <p>Помилка завантаження даних</p>
      <button className="retry-button">Спробувати знову</button>
    </div>
  );

  if (tours.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon">🔍</div>
      <p>Нічого не знайдено</p>
      <span>Спробуйте змінити параметри пошуку</span>
    </div>
  );

  return (
    <div className="Card">
      {tours.map((tour) => (
        <Link to={`/TourDetails/${tour.id}`} key={tour.id} className="Card-link">
          <Card isPressable className="Card-tour">
            <div className="Card-image-container">
              <Image
                radius="none"
                width="100%"
                height="100%"
                alt={tour.title}
                src={`http://127.0.0.1:1323${tour.imageSrc}`}
                className="Card-image"
                style={{
                  objectFit: "cover",
                  objectPosition: "center"
                }}
              />
              <div className="Card-overlay">
                <span className="Card-view">Переглянути</span>
              </div>
            </div>
            <CardFooter className="Card-footer">
              <div className="Tour-title">{tour.title}</div>
              <div className="Tour-price">{tour.price} ₴</div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
};
