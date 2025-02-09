import {Card, CardFooter, CardBody, Image} from "@nextui-org/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from 'react-router-dom';
import "./Cards.scss";

interface Tour {
    id           :number   
		title        :string  
		description  :string  
		price        :number
		imageSrc     :string  
}

export const Cards : React.FC =()=>{
    const {isPending,error,data} = useQuery({
      queryKey : ['toursData'],
      queryFn: async()=>{
        const fetched = await fetch('/api/cards');
        const tours:Tour[] = await fetched.json();
        return tours;
      },
    })
    
  if(error){
    return <p>Error</p>
  }
  if (isPending) {
    return <p>Loading...</p>;
  }
  return(
    <div className="Card">
      {data.map(tour=> (
        <Link to={`/TourDetails/${tour.id}`} key={tour.id} className="Card-link">
        <Card shadow="lg" isPressable className="Card-tour" >
            <CardBody className="Card-body">
            <Image
              shadow="sm"
              radius="lg"
              width="100%"
              alt={tour.title}
              src={`http://127.0.0.1:1323${tour.imageSrc}`}
              className="Card-image"
              //src="./Taiwan.jpg"
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