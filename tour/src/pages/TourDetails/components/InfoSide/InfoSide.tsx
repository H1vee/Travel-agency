import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Form } from "../Form/Form";
import "./InfoSide.scss";


interface TourData {
  id: string;
  title: string;
  country: string;
  rating: number;
  status: string;
  date_from: Date;
  date_to: Date;
  duration: number;
  availableSeats: number;
  totalSeats: number;
  detailedDescription: string;
  datefrom: string;
  dateto: string;
}

export const InfoSide = () => {
  const { id } = useParams();
  const { isPending, error, data } = useQuery({
    queryKey: ["tourData", id],
    queryFn: async () => {
      const fetched = await fetch(`/api/tours/${id}`);
      if (!fetched.ok) throw new Error("Tour not found");
      const rawTour: any = await fetched.json();
      console.log("Raw tour data:", rawTour);
      return {
        ...rawTour,
        date_from: new Date(Date.parse(rawTour.datefrom)),
        date_to: new Date(Date.parse(rawTour.dateto)),
      } as TourData;
    },
    enabled: !!id,
  });

  if (isPending) return <p className="loading-state">Loading...</p>;
  if (error) return <p className="error-state">Error: {error.message}</p>;
  if (!data) return <p className="not-found-state">Tour not found</p>;

  
  const seatsPercentage = Math.round(((data.totalSeats - data.availableSeats) / data.totalSeats) * 100);
  
  
  const getStatusClass = (status: string): string => {
    switch(status.toLowerCase()) {
      case 'available': return 'available';
      case 'pending': return 'pending';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'active': return 'available'; 
      default: return '';
    }
  };
  
  
  const renderRatingStars = (rating: number): JSX.Element => {
    const stars = [];
    const roundedRating = Math.round(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className="star">
          {i < roundedRating ? "★" : "☆"}
        </span>
      );
    }
    
    return <div className="rating-stars">{stars}</div>;
  };

  return (
    <div className="InfoSide">
      <Card key={data.id} className="InfoSide-Card">
        <CardHeader className="InfoSide-CardHeader">
          <h2 className="InfoSide-title">{data.title}</h2>
          <h3 className="InfoSide-tourCountry">{data.country}</h3>
        </CardHeader>
        <CardBody className="InfoSide-CardBody">
          <div className="InfoSide-column">
            <div className="InfoSide-item">
              <div className="InfoSide-label">Рейтинг</div>
              <div className="InfoSide-value">
                {data.rating} {renderRatingStars(data.rating)}
              </div>
            </div>
            
            <div className="InfoSide-item">
              <div className="InfoSide-label">Статус</div>
              <div className="InfoSide-value">
                <span className={`InfoSide-statusBadge ${getStatusClass(data.status)}`}>
                  {data.status}
                </span>
              </div>
            </div>
            
            <div className="InfoSide-item">
              <div className="InfoSide-label">Дати</div>
              <div className="InfoSide-value">
                {data.date_from.toLocaleDateString("uk-UA")} - {data.date_to.toLocaleDateString("uk-UA")}
              </div>
            </div>
            
            <div className="InfoSide-item">
              <div className="InfoSide-label">Тривалість</div>
              <div className="InfoSide-value">{data.duration} days</div>
            </div>
            
            <div className="InfoSide-item">
              <div className="InfoSide-label">Доступні місця</div>
              <div className="InfoSide-value InfoSide-seatsAvailability">
                <span>{data.availableSeats}</span>
                <div className="InfoSide-progressBar">
                  <div className="InfoSide-progress" style={{ width: `${seatsPercentage}%` }}></div>
                </div>
                <span>{data.totalSeats}</span>
              </div>
            </div>
          </div>
          
          <div className="InfoSide-description">
            <div className="InfoSide-descriptionLabel">Опис:</div>
            <div className="InfoSide-descriptionContent">{data.detailedDescription}</div>
          </div>
          
          <Form />
        </CardBody>
      </Card>
    </div>
  );
};