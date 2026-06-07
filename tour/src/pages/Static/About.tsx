import React from 'react';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import './Static.scss';

export const About: React.FC = () => (
  <>
    <Navbar />
    <div className="static-page">
      <h1>Про нас</h1>
      <p>
        AutoBoss — команда, що допомагає українцям купувати якісні автомобілі з
        Європи та США під ключ. Ми беремо на себе підбір, перевірку технічного
        стану, доставку, розмитнення та постановку на облік.
      </p>

      <div className="static-page__grid">
        <div className="static-card">
          <h3>Підбір під ключ</h3>
          <p>Знайдемо авто під ваш бюджет, перевіримо історію та стан.</p>
        </div>
        <div className="static-card">
          <h3>Прозорі ціни</h3>
          <p>Жодних прихованих платежів — ви бачите повну вартість заздалегідь.</p>
        </div>
        <div className="static-card">
          <h3>Повний супровід</h3>
          <p>Доставка, розмитнення та оформлення документів — все під ключ.</p>
        </div>
      </div>
    </div>
    <Footer />
  </>
);
