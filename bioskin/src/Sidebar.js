// src/Sidebar.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import {
    FaTachometerAlt, FaBoxOpen, FaTags, FaShoppingCart,
    FaTruckMoving, FaUsers, FaUserCircle, FaSignOutAlt,
    FaFileUpload, FaPenSquare, FaChartBar // Added more icons
} from 'react-icons/fa';
import appLogo from './assets/logo.png';
function Sidebar({ onLogout, currentUser }) {
  const navigate = useNavigate();
  const location = useLocation(); // To highlight active link

  const handleLogoutClick = async () => {
    try {
      await window.electronAPI.logout();
      onLogout();
      navigate('/login');
    } catch (err) {
      console.error("Sidebar Logout error:", err);
    }
  };

  // --- Define your navigation links ---
  // The 'path' should match your Route paths in App.js
  // The 'adminOnly' flag will hide links from non-admin users
  const mainNavLinks = [
    { path: '/', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/products', label: 'Inventory', icon: <FaBoxOpen /> },
    // { path: '/categories', label: 'Categories', icon: <FaTags />, adminOnly: true }, // Example for future
    // { path: '/orders', label: 'Orders', icon: <FaShoppingCart /> }, // Example for future
    // { path: '/suppliers', label: 'Suppliers', icon: <FaTruckMoving />, adminOnly: true }, // Example for future
  ];

  const adminToolsLinks = [
    { path: '/analytics', label: 'Analytics', icon: <FaChartBar />, adminOnly: true },
    { path: '/bulk-update', label: 'Bulk Update', icon: <FaPenSquare />, adminOnly: true },
    { path: '/initial-import', label: 'Initial Import', icon: <FaFileUpload />, adminOnly: true },
    // { path: '/users', label: 'Users', icon: <FaUsers />, adminOnly: true }, // Example for future
  ];

  // const userProfileLinks = [
  //   { path: '/profile', label: 'Profile', icon: <FaUserCircle /> }, // Example for future
  // ];

  const renderLinks = (linksArray) => {
    return linksArray.map(link => {
      if (link.adminOnly && currentUser?.role !== 'admin') {
        return null;
      }
      return (
        <li key={link.path} className={location.pathname === link.path ? 'active' : ''}>
          <Link to={link.path}>
            {link.icon}
            <span>{link.label}</span>
          </Link>
        </li>
      );
    });
  };

  return (
    <div className="sidebar">
            <div className="sidebar-header">
              <img src={"logo.png"} alt="Bioskin Logo" className="sidebar-logo" />
              <h3>Bioskin IMS</h3>
            </div>
      <nav className="sidebar-nav">
        <p className="nav-section-title">Main Menu</p>
        <ul>
          {renderLinks(mainNavLinks)}
        </ul>

        {currentUser?.role === 'admin' && (
          <>
            <p className="nav-section-title">Admin Tools</p>
            <ul>
              {renderLinks(adminToolsLinks)}
            </ul>
          </>
        )}

        {/* <p className="nav-section-title">User</p>
        <ul>
          {renderLinks(userProfileLinks)}
        </ul> */}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogoutClick} className="logout-button">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
        {currentUser && (
          <div className="sidebar-user-info">
            Logged in as: {currentUser.username} ({currentUser.role})
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;