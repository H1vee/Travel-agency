import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { Home } from '../../pages/Home/Home';
import { Catalog } from '../../pages/Catalog/Catalog';
import { CarDetails } from '../../pages/CarDetails/CarDetails';
import { About } from '../../pages/Static/About';
import { Contacts } from '../../pages/Static/Contacts';
import { Navbar } from '../../components/Navbar/Navbar';
import { AdminLayout, Dashboard, AdminCars, AdminInquiries } from '../../pages/Admin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const NotFound = () => (
  <>
    <Navbar />
    <div className="container mx-auto p-6 text-center" style={{ padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>404</h1>
      <p style={{ margin: '1rem 0' }}>Сторінку не знайдено</p>
      <a href="/" style={{ color: '#2563eb' }}>Повернутися на головну</a>
    </div>
  </>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/cars/:id" element={<CarDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/contacts" element={<Contacts />} />

                {/* Admin */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="cars" element={<AdminCars />} />
                  <Route path="inquiries" element={<AdminInquiries />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}

export default App;
