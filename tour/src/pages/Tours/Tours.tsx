import {Navbar} from '../../components/Navbar/Navbar';
import {Cards} from './components/Cards/Cards';
import {SearchBar} from './components/SearchBar/SearchBar';
import {SideBar} from './components/SideBar/SideBar';
import './Tours.scss';

export const Tours =()=>{

    return (
        <div className="Tours">
            <Navbar />
            <SearchBar/>
            <div className="Tours-content">
                <SideBar/>
                <Cards />  
            </div>
        </div>
    )
};