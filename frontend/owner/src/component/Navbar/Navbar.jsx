// component/Navber/Navbar.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React from 'react';
import './Navbar.css';
import { FaBell, FaUserCircle, FaBars } from 'react-icons/fa';
import logo from '../../assets/logo.png';

const Navbar = ({ onMobileMenuClick, isMobile, isMenuOpen }) => {
  return (
    <div className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
      {/* Mobile Menu Button */}
      <div className="mobile-menu-btn" onClick={onMobileMenuClick}>
        <FaBars />
      </div>

      {/* Logo - Always show in center */}
      <div className="navbar-logo">
        {logo ? (
          <img src={logo} alt="Logo" className="nav-logo-img" />
        ) : (
          <span className="logo-text">LOGO</span>
        )}
      </div>

      {/* Right Section */}
      <div className="nav-right">
        <div className="nav-item">
          <div className="notification-icon">
            <FaBell />
            <span className="notification-badge">3</span>
          </div>
        </div>

        <div className="nav-item user-profile">
          {!isMobile && <span className="user-name">John Doe</span>}
          <FaUserCircle className="user-avatar" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
