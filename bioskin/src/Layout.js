// src/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout({ currentUser, onLogout }) {
  if (!currentUser) { // Basic check, though ProtectedRoute should handle this
      return null;
  }
  return (
    <div className="app-layout">
      <Sidebar currentUser={currentUser} onLogout={onLogout} />
      <main className="main-content"> {/* Changed div to main for semantics */}
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;