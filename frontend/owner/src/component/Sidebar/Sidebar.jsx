// component/Sidebar/Sidebar.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import logo from '../../assets/logo.png';
import {
  FaHome,
  FaChartLine,
  FaUsers,
  FaFolder,
  FaCog,
  FaEnvelope,
  FaTimes,
  FaChevronDown,
  FaPlus,
  FaList,
  FaPalette,
  FaRuler,
  FaTable,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isMobileMenuOpen, onMobileMenuClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedItems, setExpandedItems] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: <FaHome />, title: 'Home', path: '/owner-dashboard' },
    {
      icon: <FaFolder />,
      title: 'Products',
      subItems: [
        { icon: <FaPlus />, title: 'Add Product', path: '/products/add' },
        { icon: <FaList />, title: 'Product List', path: '/products/list' },
      ],
    },
    {
      icon: <FaUsers />,
      title: 'Employees',
      subItems: [
        { icon: <FaPlus />, title: 'Add Employee', path: '/employees/add' },
        { icon: <FaList />, title: 'Employee List', path: '/employees/list' },
      ],
    },
    {
      icon: <FaChartLine />,
      title: 'Expenses',
      subItems: [
        { icon: <FaPlus />, title: 'Add Expense', path: '/expenses/add' },
        { icon: <FaList />, title: 'Expense History', path: '/expenses/list' },
      ],
    },
    {
      icon: <FaCog />, 
      title: 'Product Setup',
      subItems: [
        { icon: <FaPalette />, title: 'Color Management', path: '/products-setup/color-management' },
        { icon: <FaRuler />, title: 'Size Management', path: '/products-setup/sizes-management' },
        { icon: <FaTable />, title: 'Options Table', path: '/products-setup/options-management' },
      ],
    },
    { icon: <FaTable />, title: 'cancel Orders', path: '/cancel-orders' },
    // { icon: <FaTable />, title: 'Log Out', path: '/cancel-orders' },
    { icon: <FaCog />, title: 'Settings', path: '/admin-settings' },
  ];

  // Only show hover expand on desktop
  const handleMouseEnter = () => {
    if (!isMobile) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsExpanded(false);
      setExpandedItems({}); // Close all dropdowns when sidebar collapses
    }
  };

  const toggleDropdown = (title) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleItemClick = (path) => {
    navigate(path);
    if (isMobile) {
      onMobileMenuClose();
    }
  };

  return (
    <>
      {isMobile && (
        <div 
          className={`sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`}
          onClick={onMobileMenuClose}
        />
      )}
      <div
        className={`sidebar ${isExpanded ? 'expanded' : ''} ${
          isMobile ? 'mobile' : ''
        } ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="mobile-close" onClick={onMobileMenuClose}>
            <FaTimes />
          </div>
        )}

        {/* Only show logo on desktop or when mobile menu is open */}
        {(!isMobile || isMobileMenuOpen) && (
          <div className="logo-container">
            {logo ? (
              <img src={logo} alt="Logo" className="logo" />
            ) : (
              <span style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#23b893'
              }}>
                LOGO
              </span>
            )}
          </div>
        )}

        <div className="menu-items">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-item-wrapper">
              <div 
                className={`menu-item ${item.subItems ? 'has-dropdown' : ''}`}
                onClick={() => item.subItems ? toggleDropdown(item.title) : handleItemClick(item.path)}
              >
                <span className="icon">{item.icon}</span>
                <span className="title">{item.title}</span>
                {item.subItems && (isExpanded || isMobile) && (
                  <FaChevronDown className={`dropdown-icon ${expandedItems[item.title] ? 'rotated' : ''}`} />
                )}
              </div>
              {item.subItems && (isExpanded || isMobile) && expandedItems[item.title] && (
                <div className="submenu">
                  {item.subItems.map((subItem, subIndex) => (
                    <div 
                      key={subIndex} 
                      className="submenu-item"
                      onClick={() => handleItemClick(subItem.path)}
                    >
                      <span className="icon">{subItem.icon}</span>
                      <span className="title">{subItem.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;