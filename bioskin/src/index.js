// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import your main CSS file
import App from './App'; // Import the main App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode helps catch potential problems in your components
  <React.StrictMode>
    <App />
  </React.StrictMode>
);