// tour/src/pages/TourDetails/TourDetails.tsx
import { useParams } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { TourSwiper } from './components/Swiper/TourSwiper';
import { InfoSide } from './components/InfoSide/InfoSide';
import { TourComments } from '../../components/TourComments/TourComments';
import { Footer } from '../Main/components/Footer/Footer';
import './TourDetails.scss';

export const TourDetails = () => {
  const { id } = useParams<{ id: string }>();
  const tourId = id ? parseInt(id) : 0;

  return (
    <div className="tour-details">
      <Navbar />
      
      <main className="tour-details__content">
        <section className="tour-details__main">
          <div className="tour-details__swiper-container">
            <TourSwiper />
          </div>
          
          <div className="tour-details__info-container">
            <InfoSide />
          </div>
        </section>

        {/* Додаємо секцію коментарів */}
        {tourId > 0 && (
          <section className="tour-details__comments">
            <TourComments tourId={tourId} />
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};