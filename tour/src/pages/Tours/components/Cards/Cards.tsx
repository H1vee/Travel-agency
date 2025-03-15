import { Card, CardFooter, CardBody, Image } from "@heroui/react";
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
  if (loading) return <p>Loading...</p>;
  if (!Array.isArray(tours)) return <p>Помилка завантаження даних</p>;
  if (tours.length === 0) return <p style={{ textAlign: 'center', padding: '20px', fontSize: '1.2rem' }}>Нічого не знайдено</p>;
  
  return (
    <div className="Card">
      {tours.map((tour) => (
        <Link to={`/TourDetails/${tour.id}`} key={tour.id} className="Card-link">
          <Card shadow="lg" isPressable className="Card-tour">
            <div className="Card-image-container">
              <Image
                shadow="sm"
                radius="none"
                alt={tour.title}
                src={`http://127.0.0.1:1323${tour.imageSrc}`}
                className="Card-image"
              />
            </div>
            <CardFooter className="Card-footer">
              <div className="Tour-title">{tour.title}</div>
              <div className="Tour-price">{tour.price}</div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
};