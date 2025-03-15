import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Form } from "../Form/Form";
import "./InfoSide.scss";

// Define interface for the tour data
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
  detailed_description: string;
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

  // Calculate seats percentage for progress bar
  const seatsPercentage = Math.round(((data.totalSeats - data.availableSeats) / data.totalSeats) * 100);
  
  // Determine status class
  const getStatusClass = (status: string): string => {
    switch(status.toLowerCase()) {
      case 'available': return 'available';
      case 'pending': return 'pending';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };
  
  // Generate rating stars
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
      <Card key={data.id} className="Card">
        <CardHeader className="CardHeader">
          <h2>{data.title}</h2>
        </CardHeader>
        <CardBody className="CardBody">
          <h3>{data.country}</h3>
          
          <div className="info-row">
            <div className="info-item">
              <div className="label">Rating</div>
              <div className="value">
                {data.rating} {renderRatingStars(data.rating)}
              </div>
            </div>
            
            <div className="info-item">
              <div className="label">Status</div>
              <div className="value">
                <span className={`status-badge ${getStatusClass(data.status)}`}>
                  {data.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="info-row">
            <div className="info-item">
              <div className="label">Dates</div>
              <div className="value">
                {data.date_from.toLocaleDateString("uk-UA")} - {data.date_to.toLocaleDateString("uk-UA")}
              </div>
            </div>
            
            <div className="info-item">
              <div className="label">Duration</div>
              <div className="value">{data.duration} days</div>
            </div>
          </div>
          
          <div className="info-item">
            <div className="label">Available Seats</div>
            <div className="value seats-availability">
              <span>{data.availableSeats}</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${seatsPercentage}%` }}></div>
              </div>
              <span>{data.totalSeats}</span>
            </div>
          </div>
          
          <div className="description">
            <div className="description-label">Description:</div>
            <div className="description-content">{data.detailed_description}</div>
          </div>
          
          <Form />
        </CardBody>
      </Card>
    </div>
  );
};