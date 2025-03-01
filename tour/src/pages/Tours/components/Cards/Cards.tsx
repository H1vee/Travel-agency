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
  // Логируем полученные данные для отладки
  console.log("Tours data:", tours);

  if (loading) return <p>Loading...</p>;

  // Проверяем, что tours - это массив
  if (!Array.isArray(tours)) return <p>Ошибка загрузки данных</p>;

  if (tours.length === 0) return <p>Нічого не знайдено</p>;

  return (
    <div className="Card">
      {tours.map((tour) => (
        <Link to={`/TourDetails/${tour.id}`} key={tour.id} className="Card-link">
          <Card shadow="lg" isPressable className="Card-tour">
            <CardBody className="Card-body">
              <Image
                shadow="sm"
                radius="lg"
                width="100%"
                alt={tour.title}
                src={`http://127.0.0.1:1323${tour.imageSrc}`}
                className="Card-image"
              />
            </CardBody>
            <CardFooter className="Card-footer">
              <b className="Tour-title">{tour.title}</b>
              <p className="Tour-price">{tour.price}</p>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
};
