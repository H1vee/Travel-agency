import React from 'react';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../Main/components/Footer/Footer';
import { ToursPage } from './components/ToursPage/ToursPage';

export const Tours: React.FC = () => {
  return (
    <>
      <Navbar />
      <ToursPage />
      <Footer />
    </>
  );
};