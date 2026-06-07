import React from 'react';
import { Link } from 'react-router-dom';
import { carService } from '../../services/CarService';
import { CarCard as CarCardType, FUEL_LABELS, label } from '../../types/cars';
import './CarCard.scss';

interface Props {
  car: CarCardType;
}

const fmtPrice = (v: number) => `$${Math.round(v).toLocaleString('uk-UA')}`;
const fmtKm = (v: number) => `${(v || 0).toLocaleString('uk-UA')} км`;

export const CarCard: React.FC<Props> = ({ car }) => (
  <Link to={`/cars/${car.id}`} className="car-card">
    <div className="car-card__image">
      <img
        src={carService.getImageUrl(car.imageSrc)}
        alt={`${car.make} ${car.model}`}
        loading="lazy"
      />
      {car.bodyType && <span className="car-card__badge">{car.bodyType}</span>}
    </div>
    <div className="car-card__body">
      <h3 className="car-card__title">
        {car.make} {car.model}
      </h3>
      <div className="car-card__meta">
        <span>{car.year}</span>
        <span>{fmtKm(car.mileage)}</span>
        {car.fuelType && <span>{label(FUEL_LABELS, car.fuelType)}</span>}
      </div>
      <div className="car-card__price">{fmtPrice(car.price)}</div>
    </div>
  </Link>
);
