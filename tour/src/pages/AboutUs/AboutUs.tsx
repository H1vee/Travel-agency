import {Navbar} from '../../components/Navbar/Navbar';
import {Footer} from '../Main/components/Footer/Footer'
import {DescriberHero} from './components/DescriberHero/DescriberHero';
import { Describer } from './components/Describer/Describer';
import { Services } from './components/Services/Services';
import { WhyUs } from './components/WhyUs/WhyUs';
import { HowItWorks } from './components/HowItWorks/HowItWorks';
import './AboutUs.scss'
import backgroundImage from './stand.jpg';
export const AboutUs =()=>{
    return (
        <div className="AboutUs">
            <Navbar />
            <DescriberHero
            title="OpenWorld – ваш провідник у світ незабутніх подорожей!"
            description="Ми створили OpenWorld, щоб зробити ваші подорожі простими, доступними та незабутніми. Обирайте напрямок – ми подбаємо про все інше!"
            buttonText="Знайти тур"
            backgroundImage={backgroundImage}
            />
            <Describer/>
            <Services />
            <WhyUs />
            <HowItWorks />
            <Footer/>
        </div>
    );

}