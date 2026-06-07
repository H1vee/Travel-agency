import React, { useState } from 'react';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { InquiryModal } from '../../components/InquiryModal/InquiryModal';
import './Static.scss';

export const Contacts: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Navbar />
      <div className="static-page">
        <h1>Контакти</h1>
        <p>Зв'яжіться з нами у зручний спосіб або залиште заявку — ми передзвонимо.</p>

        <div className="static-page__grid">
          <div className="static-card">
            <h3>Телефон</h3>
            <a href="tel:+380000000000">+380 (00) 000-00-00</a>
          </div>
          <div className="static-card">
            <h3>Email</h3>
            <a href="mailto:info@autoboss.ua">info@autoboss.ua</a>
          </div>
          <div className="static-card">
            <h3>Адреса</h3>
            <p>м. Київ, Україна</p>
          </div>
        </div>

        <button className="static-page__cta" onClick={() => setOpen(true)}>
          Залишити заявку
        </button>
      </div>

      <InquiryModal open={open} onClose={() => setOpen(false)} requestType="question" />
      <Footer />
    </>
  );
};
