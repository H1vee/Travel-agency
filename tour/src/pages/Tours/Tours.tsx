import {Navbar} from '../../components/Navbar/Navbar';
import {Footer} from '../Main/components/Footer/Footer'
import {ToursPage} from './components/ToursPage/ToursPage'
import './Tours.scss';

export const Tours = () => {
    return (
        <div className="tours">
            <Navbar />
            <div className="tours__wrapper">
                <ToursPage />
            </div>
            <Footer />
        </div>
    );
};