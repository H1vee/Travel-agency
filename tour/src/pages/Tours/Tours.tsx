import {Navbar} from '../../components/Navbar/Navbar';
import {Footer} from '../Main/components/Footer/Footer'
import {ToursPage} from './components/ToursPage/ToursPage'
import './Tours.scss';

export const Tours =()=>{

    return (
        <div className="Tours">
            <div className="Tours-Navbar">
               <Navbar /> 
            </div>
            <div className="Tours-Page">
              <ToursPage/>  
            </div>
            <div className="Tours-Footer">
              <Footer/>   
            </div>
           
        </div>
    )
};