import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  ArrowUp,
  Shield,
  Heart
} from 'lucide-react';
import './Footer.scss';

export const Footer: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__main">
            <div className="footer__brand">
              <div className="footer__brand-header">
                <div className="footer__brand-logo">
                  <Globe />
                </div>
                <h2 className="footer__brand-name">OpenWorld</h2>
              </div>
              
              <p className="footer__brand-description">
                Відкривайте світ разом з нами! Ми створюємо незабутні подорожі та допомагаємо 
                втілити ваші мрії про ідеальну відпустку.
              </p>

              <div className="footer__brand-contact">
                <div className="footer__brand-contact-item">
                  <MapPin />
                  <span>вул. Хрещатик, 1, Київ, Україна</span>
                </div>
                <div className="footer__brand-contact-item">
                  <Phone />
                  <span>+38 (044) 123-45-67</span>
                </div>
                <div className="footer__brand-contact-item">
                  <Mail />
                  <span>info@openworld.com.ua</span>
                </div>
              </div>

              <div className="footer__brand-social">
                <a href="#" className="footer__brand-social-link" aria-label="Facebook">
                  <Facebook />
                </a>
                <a href="#" className="footer__brand-social-link" aria-label="Twitter">
                  <Twitter />
                </a>
                <a href="#" className="footer__brand-social-link" aria-label="Instagram">
                  <Instagram />
                </a>
                <a href="#" className="footer__brand-social-link" aria-label="YouTube">
                  <Youtube />
                </a>
              </div>
            </div>
            <div className="footer__links">
              <div className="footer__links-group">
                <h4 className="footer__links-group-title">Компанія</h4>
                <div className="footer__links-group-links">
                  <Link to="/AboutUs" className="footer__links-group-link">Про нас</Link>
                  <Link to="/Tours" className="footer__links-group-link">Тури</Link>
                  <a href="/careers" className="footer__links-group-link">Кар'єра</a>
                  <a href="/partners" className="footer__links-group-link">Партнери</a>
                  <a href="/news" className="footer__links-group-link">Новини</a>
                </div>
              </div>

              <div className="footer__links-group">
                <h4 className="footer__links-group-title">Послуги</h4>
                <div className="footer__links-group-links">
                  <a href="/individual-tours" className="footer__links-group-link">Індивідуальні тури</a>
                  <a href="/group-tours" className="footer__links-group-link">Групові тури</a>
                  <a href="/business-travel" className="footer__links-group-link">Бізнес-подорожі</a>
                  <a href="/visa-support" className="footer__links-group-link">Візова підтримка</a>
                  <a href="/insurance" className="footer__links-group-link">Страхування</a>
                </div>
              </div>

              <div className="footer__links-group">
                <h4 className="footer__links-group-title">Підтримка</h4>
                <div className="footer__links-group-links">
                  <a href="/help" className="footer__links-group-link">Допомога</a>
                  <a href="/contact" className="footer__links-group-link">Контакти</a>
                  <a href="/faq" className="footer__links-group-link">FAQ</a>
                  <a href="/reviews" className="footer__links-group-link">Відгуки</a>
                  <a href="/blog" className="footer__links-group-link">Блог</a>
                </div>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <div className="footer__bottom-left">
              <div className="footer__bottom-copyright">
                © {currentYear} OpenWorld. Усі права захищені.
              </div>
              <div className="footer__bottom-legal">
                <a href="/privacy" className="footer__bottom-legal-link">
                  Політика конфіденційності
                </a>
                <a href="/terms" className="footer__bottom-legal-link">
                  Умови використання
                </a>
                <a href="/cookies" className="footer__bottom-legal-link">
                  Файли cookie
                </a>
              </div>
            </div>

            <div className="footer__bottom-right">
              <div className="footer__bottom-right-badge">
                <Shield />
                <span>Сертифіковано</span>
              </div>
              <div className="footer__bottom-right-badge">
                <Heart />
                <span>Зроблено з любов'ю в Україні</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <button
        className={`footer__scroll-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ArrowUp />
      </button>
    </>
  );
};