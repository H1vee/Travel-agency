import {Navbar} from '../../components/Navbar/Navbar';
import {Swiper} from './components/Swiper/Swiper';
import {Hero} from './components/Hero/Hero';
import {Footer} from './components/Footer/Footer';
import './Main.css';

export const Main = () => {
  return (
    <div className="Main">
      <Navbar />
      <Swiper />
      <Hero></Hero>
      <Footer></Footer>
    </div>
  )
}