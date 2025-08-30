import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/Navbar';
import { Main } from '../../pages/Main/Main';
import { AboutUs } from '../../pages/AboutUs/AboutUs';
import { Tours } from '../../pages/Tours/Tours';
import { TourDetails } from '../../pages/TourDetails/TourDetails';
import { UserProfile } from '../../pages/Profile/UserProfile';
import { UserBookings } from '../../pages/Bookings/UserBookings';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Main />} />
                  <Route path="/AboutUs" element={<AboutUs />} />
                  <Route path="/Tours" element={<Tours />} />
                  <Route path="/TourDetails/:id" element={<TourDetails />} />
                  
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/bookings" element={<UserBookings />} />
                  <Route path="/favorites" element={<UserFavorites />} />
                  <Route path="/settings" element={<UserSettings />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}

const UserBookings = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Мої бронювання</h1>
        <p>Тут будуть бронювання користувача</p>
      </div>
    </>
  );
};

const UserFavorites = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Обране</h1>
        <p>Тут будуть обрані тури</p>
      </div>
    </>
  );
};

const UserSettings = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Налаштування</h1>
        <p>Тут будуть налаштування користувача</p>
      </div>
    </>
  );
};

const NotFound = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-4">Сторінку не знайдено</p>
        <a href="/" className="text-blue-500 hover:underline">
          Повернутися на головну
        </a>
      </div>
    </>
  );
};

export default App;