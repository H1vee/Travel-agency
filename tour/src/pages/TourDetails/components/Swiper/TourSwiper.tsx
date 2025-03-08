import { Swiper as SwiperBase, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Navigation} from 'swiper/modules';
import { useQuery } from '@tanstack/react-query';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation'
import { useParams } from 'react-router';

interface Tour {
    tourID : number
    image_src: string
  }
export const TourSwiper: React.FC =()=>{
  const {id} = useParams();
    const { isPending, error, data } = useQuery({
        queryKey: ['toursData',id],
        queryFn: async() => {
          const fetched = await fetch(`/api/tour-carousel/${id}`);
          if (!fetched.ok) throw new Error("Tour not found");
          const tours: Tour[] = await fetched.json();
          return tours;
        },
      })
      if (isPending) return <p>Loading...</p>;
      if (error) return <p>Error: {error.message}</p>;
      if (!data) return <p>Tour not found</p>;
    return(
        <SwiperBase
        modules={[Pagination, A11y,Navigation]}
        slidesPerView={1}
        spaceBetween={50}
        navigation = {true}
        pagination={{ clickable: true }}
        className={'Swiper'}
      >
        {data.slice(0,4).map((tour, index) => (
          <SwiperSlide key={`${tour.tourID}-${index}`} className={'Swiper-Slide'} style={{ backgroundImage: `url("http://localhost:1323${tour.image_src}")`}}>
        
          </SwiperSlide>
        ))}
      </SwiperBase>
    );
}