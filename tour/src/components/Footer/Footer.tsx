import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.scss';

export const Footer: React.FC = () => (
  <footer className="footer">
    <div className="footer__inner">
      <div className="footer__col">
        <div className="footer__logo">
          <span>AUTO</span>BOSS
        </div>
        <p>Підбір та продаж автомобілів під ключ. Чесно, прозоро, надійно.</p>
      </div>

      <div className="footer__col">
        <h4>Навігація</h4>
        <Link to="/">Головна</Link>
        <Link to="/catalog">Каталог</Link>
        <Link to="/about">Про нас</Link>
        <Link to="/contacts">Контакти</Link>
      </div>

      <div className="footer__col">
        <h4>Контакти</h4>
        <a href="tel:+380000000000">+380 (00) 000-00-00</a>
        <a href="mailto:info@autoboss.ua">info@autoboss.ua</a>
        <span>м. Київ, Україна</span>
      </div>
    </div>
    <div className="footer__bottom">
      © {new Date().getFullYear()} AutoBoss. Усі права захищено.
    </div>
  </footer>
);
