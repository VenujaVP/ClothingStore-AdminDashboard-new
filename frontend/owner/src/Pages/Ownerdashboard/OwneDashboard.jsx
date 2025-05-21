//OwneDashboard

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaShoppingCart, FaBoxOpen, FaUser, FaMoneyBillWave, 
  FaChartLine, FaExchangeAlt, FaExclamationTriangle,
  FaCalendarAlt, FaShippingFast, FaClock, FaCheck
} from 'react-icons/fa';

import withAuth from '../withAuth';
import './OwneDashboard.css';

const OwneDashboard = ({ userId }) => {
  // State for dashboard data

  return (
    <div className="owner-dashboard">

  
    </div>
  );
};

const AuthenticatedOwneDashboard = withAuth(OwneDashboard);
export default AuthenticatedOwneDashboard;
