import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import {NextUIProvider} from "@nextui-org/react";
import {Main} from '../../pages/Main/Main';
import {AboutUs} from '../../pages/AboutUs/AboutUs';
import {Tours} from '../../pages/Tours/Tours';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path='/AboutUs' element={<AboutUs />}/>
            <Route path='/Tours' element={<Tours />}/>
          </Routes>
        </Router>
      </NextUIProvider>
    </QueryClientProvider>
  );
}

export default App;
