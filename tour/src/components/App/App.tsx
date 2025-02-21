import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import {HeroUIProvider} from "@heroui/react";
import {Main} from '../../pages/Main/Main';
import {AboutUs} from '../../pages/AboutUs/AboutUs';
import {Tours} from '../../pages/Tours/Tours';
import { TourDetails } from '../../pages/TourDetails/TourDetails';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path='/AboutUs' element={<AboutUs />}/>
            <Route path='/Tours' element={<Tours />}/>
            <Route path='/TourDetails/:id' element={<TourDetails />}/>
          </Routes>
        </Router>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}

export default App;
