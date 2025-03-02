import {Navbar} from '../../components/Navbar/Navbar';
import {Footer} from '../Main/components/Footer/Footer'
import {ToursPage} from './components/ToursPage/ToursPage'
import './Tours.scss';

export const Tours =()=>{

    return (
        <div className="Tours">
            <Navbar />
                <ToursPage></ToursPage>
            <Footer></Footer>
        </div>
    )
};