import {Navbar} from '../../components/Navbar/Navbar';
import { TourSwiper } from './components/Swiper/TourSwiper';
import { InfoSide } from './components/InfoSide/InfoSide';
import {Footer} from '../Main/components/Footer/Footer'

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
        </div>
        <div className="TourDetails-footer">
          <Footer/>
        </div>
      </div>
    </div>
    )
}