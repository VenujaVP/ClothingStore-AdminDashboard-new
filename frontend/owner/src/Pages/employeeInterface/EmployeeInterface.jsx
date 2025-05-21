/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState } from 'react';
import withAuth from '../withAuth';
import './EmployeeInterface.css';

// Import the components to be shown on sidebar navigation
import SettingEmployee from './SettingEmployee/SettingEmployee';
import OrderPage from './OrderPage/OrderPage';

// Icons for the sidebar
import { FaClipboardList, FaCog, FaHome, FaUser } from 'react-icons/fa';

const EmployeeInterface = ({ userId }) => {
  console.log(userId)
  // State to track which sidebar item is active
  const [activeItem, setActiveItem] = useState('dashboard');

  // Function to handle sidebar item clicks
  const handleSidebarClick = (itemName) => {
    setActiveItem(itemName);
  };

  // Function to render the appropriate component based on active sidebar item
  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h2>Employee Dashboard</h2>
            <div className="welcome-card">
              <FaUser className="welcome-icon" />
              <div className="welcome-text">
                <h3>Welcome, Employee!</h3>
                <p>Employee ID: {userId}</p>
                <p>Today is {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return <OrderPage userId={userId} />;
      case 'settings':
        return <SettingEmployee userId={userId} />;
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  return (
    <div className="employee-interface">
      {/* Collapsed/Expandable Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">E</span>
            <h3 className="logo-text">Employee Portal</h3>
          </div>
        </div>
        
        <ul className="sidebar-menu">
          <li 
            className={activeItem === 'dashboard' ? 'active' : ''}
            onClick={() => handleSidebarClick('dashboard')}
          >
            <div className="menu-icon">
              <FaHome />
            </div>
            <span className="menu-text">Dashboard</span>
          </li>
          <li 
            className={activeItem === 'orders' ? 'active' : ''}
            onClick={() => handleSidebarClick('orders')}
          >
            <div className="menu-icon">
              <FaClipboardList />
            </div>
            <span className="menu-text">Order Management</span>
          </li>
          <li 
            className={activeItem === 'settings' ? 'active' : ''}
            onClick={() => handleSidebarClick('settings')}
          >
            <div className="menu-icon">
              <FaCog />
            </div>
            <span className="menu-text">Settings</span>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
};

const AuthenticatedEmployeeInterface = withAuth(EmployeeInterface);
export default AuthenticatedEmployeeInterface;
