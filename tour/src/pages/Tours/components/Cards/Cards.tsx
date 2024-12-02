import {Card, CardHeader, CardBody, Image} from "@nextui-org/react";
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
  
}