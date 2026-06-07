import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { InquiryModal } from '../../components/InquiryModal/InquiryModal';
import { carService } from '../../services/CarService';
import {
  CarDetail as CarDetailType,
  GalleryImage,
  RequestType,
  REQUEST_TYPE_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  DRIVE_LABELS,
  label,
} from '../../types/cars';
import './CarDetails.scss';

const fmtPrice = (v: number) => `$${Math.round(v).toLocaleString('uk-UA')}`;
const fmtKm = (v: number) => `${(v || 0).toLocaleString('uk-UA')} км`;

export const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<CarDetailType | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<RequestType | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([carService.getCar(id), carService.getGallery(id)])
      .then(([c, g]) => {
        setCar(c);
        setImages(g.length ? g : [{ id: 0, imageSrc: c.cardImage }]);
        setActive(0);
      })
      .catch(() => setCar(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="car-detail__state">Завантаження…</div>
        <Footer />
      </>
    );
  }

  if (!car) {
    return (
      <>
        <Navbar />
        <div className="car-detail__state">Автомобіль не знайдено.</div>
        <Footer />
      </>
    );
  }

  const specs: { label: string; value: React.ReactNode }[] = [
    { label: 'VIN-код', value: car.vin || '—' },
    { label: 'Рік випуску', value: car.year },
    { label: 'Пробіг', value: fmtKm(car.mileage) },
    { label: 'Двигун', value: car.engine || '—' },
    { label: "Об'єм двигуна", value: car.engineCapacity ? `${car.engineCapacity} л` : '—' },
    {
      label: 'Ємність батареї',
      value: car.batteryCapacity ? `${car.batteryCapacity} кВт` : '—',
    },
    { label: 'Тип палива', value: label(FUEL_LABELS, car.fuelType) },
    { label: 'Коробка передач', value: label(TRANSMISSION_LABELS, car.transmission) },
    { label: 'Привід', value: label(DRIVE_LABELS, car.drive) },
    { label: 'Тип кузова', value: car.bodyType || '—' },
    { label: 'Колір', value: car.color || '—' },
    { label: 'Кількість місць', value: car.seats || '—' },
  ];

  const carLabel = `${car.make} ${car.model} (${car.year})`;

  return (
    <>
      <Navbar />
      <div className="car-detail">
        <div className="car-detail__gallery">
          <div className="car-detail__main-image">
            <img src={carService.getImageUrl(images[active]?.imageSrc)} alt={carLabel} />
          </div>
          {images.length > 1 && (
            <div className="car-detail__thumbs">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  className={i === active ? 'active' : ''}
                  onClick={() => setActive(i)}
                >
                  <img src={carService.getImageUrl(img.imageSrc)} alt={`${carLabel} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="car-detail__info">
          <h1 className="car-detail__title">{car.make} {car.model}</h1>
          <div className="car-detail__subtitle">
            {car.year} • {fmtKm(car.mileage)} • {label(FUEL_LABELS, car.fuelType)}
          </div>
          <div className="car-detail__price">{fmtPrice(car.price)}</div>

          <div className="car-detail__cta">
            {(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((rt) => (
              <button
                key={rt}
                className={`car-detail__cta-btn ${rt === 'turnkey_quote' ? 'primary' : ''}`}
                onClick={() => setModalType(rt)}
              >
                {REQUEST_TYPE_LABELS[rt]}
              </button>
            ))}
          </div>

          <table className="car-detail__specs">
            <tbody>
              {specs.map((s) => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {car.description && (
        <div className="car-detail__description">
          <h2>Опис автомобіля</h2>
          <p>{car.description}</p>
        </div>
      )}

      <InquiryModal
        open={modalType !== null}
        onClose={() => setModalType(null)}
        requestType={modalType || 'question'}
        carId={car.id}
        carLabel={carLabel}
      />

      <Footer />
    </>
  );
};
