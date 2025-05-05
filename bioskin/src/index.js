// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your main CSS file
import AppRouter from './App'; // Import the component exported from App.js (now named AppRouter)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);