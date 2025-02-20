import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom"; 
import { Form } from "../Form/Form";

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
      };
    },
    enabled: !!id, 
  });

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data) return <p>Tour not found</p>;

  return (
    <div className="InfoSide">
      <Card key={data.id}>
        <CardHeader>
          <h2>{data.title}</h2>
        </CardHeader>
        <CardBody>
          <h3>{data.country}</h3>
          <h3>Rating: {data.rating}</h3>
          <h3>Status: {data.status}</h3>
          <h3>
              {data.date_from.toLocaleDateString("uk-UA")} -{" "}
              {data.date_to.toLocaleDateString("uk-UA")}
          </h3>
          <h3>Duration: {data.duration} days</h3>
          <h3>Вільних місць: {data.availableSeats}\{data.totalSeats}</h3>
          <h3>Опис: {data.detailed_description}</h3>
          <Form/>
        </CardBody>
      </Card>
    </div>
  );
};
