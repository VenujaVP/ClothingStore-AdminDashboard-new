/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React from 'react';
import withAuth from '../withAuth'

const ReturnsOrders = () => {
  return (
    <div>
      
    </div>
  )
}


const AuthenticatedReturnsOrders = withAuth(ReturnsOrders);
export default AuthenticatedReturnsOrders;