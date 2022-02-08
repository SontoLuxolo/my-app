import React from 'react';
//Routing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Components
import Header from './components/Header';
import Home from './components/Home';

// Styles
import { GlobalStyle } from './GlobalStyle';

const App = () => (
    <Router>
      <Header />
        <Routes>
          
        </Routes>
        <Home />
      <GlobalStyle />
    </Router>
  );

export default App;
