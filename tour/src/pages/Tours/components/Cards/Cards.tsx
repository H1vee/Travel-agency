import {Card, CardFooter, CardBody, Image} from "@nextui-org/react";
import { useQuery } from "@tanstack/react-query";

interface Tour {
  title: string;
  description: string;
  callToAction: string;
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  imageSrc: string;
}

export const Cards : React.FC =()=>{
    const {isPending,error,data} = useQuery({
      queryKey : ['toursData'],
      queryFn: async()=>{
        const fetched = await fetch('/api/tours');
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
    <div className="gap-2 grid grid-cols-2 sm:grid-cols-4">
      {data.map(tour=> (
          <Card shadow="sm" isPressable onPress={() => console.log("item pressed")}>
            <CardBody className="overflow-visible p-0">
            <Image
              shadow="sm"
              radius="lg"
              width="100%"
              alt={tour.title}
              className="w-full object-cover h-[140px]"
              src={`http://127.0.0.1:1323${tour.imageSrc}`}
            />
            </CardBody>
            <CardFooter className="text-small justify-between">
            <b>{tour.title}</b>
            <p className="text-default-500">20</p>
          </CardFooter>
          </Card>
      ))}
    </div>
  );
};