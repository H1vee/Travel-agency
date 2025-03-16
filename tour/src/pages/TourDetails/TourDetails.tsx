import { Navbar } from '../../components/Navbar/Navbar';
import { TourSwiper } from './components/Swiper/TourSwiper';
import { InfoSide } from './components/InfoSide/InfoSide';
import { Footer } from '../Main/components/Footer/Footer';
import './TourDetails.scss';

export const TourDetails = () => {
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
      </main>
      <Footer />
    </div>
  );
};