/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

// npm install react react-dom @react-oauth/google react-icons react-router-dom axios yup @mui/material @emotion/react @emotion/styled

import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css'
import Sidebar from './component/Sidebar/Sidebar';
import Navbar from './component/Navbar/Navbar';

import Login from './Pages/Enter/Login/Login';
import Register from './pages/Enter/Register/Register';
import SetNewPassword from './pages/Enter/SetNewPassword/SetNewPassword';
import ForgotPassword from './Pages/Enter/ForgotPassword/ForgotPassword';
import PasswordResetFinish from './pages/Enter/PasswordReset/PasswordResetFinish';

import LandingPage from './Pages/landingpage/landingPage';

// Import pages
import AuthenticatedAdminSettings from './Pages/AdminSettings/AdminSettings';

import AddEmployee from './Pages/Employee/AddEmployee';
import AuthenticatedAddProducts from './Pages/Products/AddProducts';
import AuthenticatedProductList from './Pages/Products/ProductList';

import AuthenticatedAddExpenses from './Pages/Expenses/AddExpenses';
import AuthenticatedExpensesList from './Pages/Expenses/ExpensesList';

import AuthenticatedEmployeeList from './Pages/Employee/EmployeeList';

import AuthenticatedEmployeeInterfaceAddEmployee from './Pages/employeeInterface/EmployeeInterface';
import AuthenticatedOwneDashboard from './Pages/Ownerdashboard/OwneDashboard';
import AuthenticatedColorManagement from './Pages/ProductsSetup/ColorManagement/ColorManagement';
import AuthenticatedSizeManagement from './Pages/ProductsSetup/SizeManagement/SizeManagement';
import AuthenticatedDeliveryOptions from './Pages/ProductsSetup/DeliveryOptions/DeliveryOptions';
import SampleQuriaService from './Pages/SampleQuriaService/SampleQuriaService';
import AuthenticatedCancelOrders from './Pages/CancelOrders/CancelOrders'


const App = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const shouldDisplaySidebar = () => {
    const excludedPaths = ['/owner-login', '/owner-register', '/owner-forgot-password', '/owner-password-reset-finish', '/owner-check-your-email', '/onlineorderchecker-dashboard', '/', '/sample-quria-service'];
    return !excludedPaths.includes(location.pathname) && !location.pathname.startsWith('/owner-reset-password');
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app">
      {shouldDisplaySidebar() && (
        <>
          <Navbar 
            onMobileMenuClick={handleMobileMenuToggle}
            isMobile={isMobile}
            isMenuOpen={isMobileMenuOpen}
          />
          <Sidebar 
            isMobileMenuOpen={isMobileMenuOpen} 
            onMobileMenuClose={() => setIsMobileMenuOpen(false)} 
          />
        </>
      )}

      <div className={`main-content ${shouldDisplaySidebar() ? '' : 'full-screen'}`}>
        <Routes>

          <Route path="/" element={<LandingPage/>} />

          <Route path="/owner-login" element={<Login />} />
          <Route path="/owner-register" element={<Register />} />
          <Route path="/owner-forgot-password" element={<ForgotPassword />} />
          <Route path="/owner-reset-password/:resetToken" element={<SetNewPassword />} />
          <Route path="/owner-password-reset-finish" element={<PasswordResetFinish />} />

          <Route path="/admin-settings" element={<AuthenticatedAdminSettings />} />
          <Route path="/products-setup/color-management" element={<AuthenticatedColorManagement />} />
          <Route path="/products-setup/sizes-management" element={<AuthenticatedSizeManagement />} />
          <Route path="/products-setup/options-management" element={<AuthenticatedDeliveryOptions />} />

          <Route path="/owner-dashboard" element={<AuthenticatedOwneDashboard />} />
          <Route path="/onlineorderchecker-dashboard" element={<AuthenticatedEmployeeInterfaceAddEmployee />} />
          
          <Route path="/employees/add" element={<AddEmployee />} />
          <Route path="/employees/list" element={<AuthenticatedEmployeeList />} />

          <Route path="/products/add" element={<AuthenticatedAddProducts />} />
          <Route path="/products/edit/:productId" element={<AuthenticatedAddProducts isEditMode />} />
          <Route path="/products/list" element={<AuthenticatedProductList />} />

          <Route path="/expenses/add" element={<AuthenticatedAddExpenses />} />
          <Route path="/expenses/list" element={<AuthenticatedExpensesList />} />
          <Route path="/expenses/edit/:id" element={<AuthenticatedAddExpenses />} />

          <Route path="/cancel-orders" element={< AuthenticatedCancelOrders/>} />

          <Route path="/sample-quria-service" element={<SampleQuriaService />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;