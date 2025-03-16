import ocean from './violet.jpeg';
import './Hero.scss';
import { Button } from "@heroui/react";
import { Link } from 'react-router-dom';

export const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container" style={{ backgroundImage: `url(${ocean})` }}>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Відкрийте світ разом з нами</h1>
            <p className="hero-description">
              Наша туристична агенція – ваш надійний гід у світі незабутніх подорожей. 
              Ми спеціалізуємось на створенні унікальних туристичних програм, які поєднують комфорт, 
              безпеку та яскраві враження.
            </p>
            <div className="hero-cta">
              <Link to="/AboutUs" className="hero-link">
                <Button color="secondary" variant="shadow" size="lg" radius="sm">
                  Про нас
                </Button>
              </Link>
              <Link to="/Tours" className="hero-link">
                <Button color="primary" variant="flat" size="lg" radius="sm">
                  Знайти тур
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};