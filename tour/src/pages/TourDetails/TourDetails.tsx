import {Navbar} from '../../components/Navbar/Navbar';
import { TourSwiper } from './components/Swiper/TourSwiper';
import { InfoSide } from './components/InfoSide/InfoSide';
import { TourDescriber } from './components/TourDescriber/TourDescriber';
import './TourDetails.scss'
export const TourDetails =()=>{
    return(
      <div className="TourDetails">
      <Navbar />
      <div className="TourDetails-content">
        <div className="TourDetails-main">
          <div className="TourDetails-swiper">
            <TourSwiper />
          </div>
          <div className="TourDetails-side">
            <InfoSide />
          </div>
        </div>
        <div className="TourDetails-describer">
          <TourDescriber />
        </div>
      </div>
    </div>
    )
}