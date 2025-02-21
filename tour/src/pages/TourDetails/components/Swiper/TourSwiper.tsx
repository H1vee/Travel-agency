import { Swiper as SwiperBase, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Navigation} from 'swiper/modules';
import { Button } from "@heroui/react";
import { useQuery } from '@tanstack/react-query';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation'

interface Tour {
    id           :number   
    title        :string  
    description  :string  
    callToAction :string  
    imageSrc     :string  
  }
export const TourSwiper: React.FC =()=>{
    const { isPending, error, data } = useQuery({
        queryKey: ['toursData'],
        queryFn: async() => {
          const fetched = await fetch('/api/tourswiper');
          const tours: Tour[] = await fetched.json();
          return tours;
        },
      })
    
      if (isPending) {
        return <p>Pending..</p>
      }
    
      if (error) {
        return <p>Error</p>;
      }
    
    return(
        <SwiperBase
        modules={[Pagination, A11y,Navigation]}
        slidesPerView={1}
        spaceBetween={50}
        navigation = {true}
        pagination={{ clickable: true }}
        className={'Swiper'}
      >
        {data.slice(0,4).map(tour => (
          <SwiperSlide key={tour.id} className={'Swiper-Slide'} style={{backgroundImage: `url("http://localhost:1323${tour.imageSrc}")`}}>
        
          </SwiperSlide>
        ))}
      </SwiperBase>
    );
}