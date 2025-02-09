import { Pagination, A11y, Autoplay } from 'swiper/modules';
import { Swiper as SwiperBase, SwiperSlide } from 'swiper/react';
import { Button } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import 'swiper/css';
import 'swiper/css/pagination';
import { Loader } from '../Loader/Loader';
import { Link } from 'react-router-dom';
import './Swiper.scss';

interface Tour {
  id           :number   
  title        :string  
  description  :string  
  callToAction :string  
  imageSrc     :string  
}

export const Swiper: React.FC = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ['toursData'],
    queryFn: async() => {
      const fetched = await fetch('/api/tourswiper');
      const tours: Tour[] = await fetched.json();
      return tours;
    },
  })

  if (isPending) {
    return <Loader />
  }

  if (error) {
    return <p>Error</p>;
  }

  return (
    <SwiperBase
      modules={[Pagination, A11y, Autoplay]}
      slidesPerView={1}

      pagination={{ clickable: true }}
      className={'Swiper'}
      autoplay={{ delay: 5000 }}
    >
      {data.slice(0,4).map(tour => (
        <SwiperSlide key={tour.id} className={'Swiper-Slide'} style={{backgroundImage: `url("http://localhost:1323${tour.imageSrc}")`}}>
          <div className={'Swiper-SlideWrapper'}>
            <p className={'Swiper-SlideTitle'}>{tour.title}</p>
            <span className={'Swiper-SlideDescription'}>{tour.description}</span>
            <Link to={`/TourDetails/${tour.id}`}>
            <Button 
            className={'Swiper-SlideAction'}
            variant='shadow'
            color='secondary' 
            radius='full'
            >
             {tour.callToAction}
            </Button>
            </Link>
            
          </div>
        </SwiperSlide>
      ))}
    </SwiperBase>
  );
};
