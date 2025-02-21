//import violet from './violet.jpeg';
import ocean from './violet.jpeg'
import './Hero.scss';
import { Button } from "@heroui/react";
import { Link } from 'react-router-dom';
export const Hero = () =>{

    return(
        
        <div className="Hero">
            <div className="Hero-Airsection" style={{backgroundImage: `url(${ocean})`}}>
                <div className="Hero-Text">
                    <p>Наша туристична агенція – ваш надійний гід у світі незабутніх подорожей. Ми спеціалізуємось на створенні унікальних туристичних програм, які поєднують комфорт</p>
                </div>
                <div className='Hero-Button'>
                    <Link to = '/AboutUs'>
                        <Button color='secondary' variant='shadow' size='lg' radius='sm'>Про нас</Button>
                    </Link>
                        
                </div>
            </div>
        </div>
    );
};