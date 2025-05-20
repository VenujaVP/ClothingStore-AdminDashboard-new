/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

//npm install react-icons react-router-dom axios yup react-slick
//npm install @mui/material @emotion/react @emotion/styled
//npm install @react-oauth/google@latest
//npm install payhere-embed-sdk
// npm install @stripe/react-stripe-js @stripe/stripe-js

import { Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react'
import './App.css'
import Navbar from './conponent/Navbar/Navbar';
import Footer from './conponent/Footer/Footer';

import Login from './pages/Enter/Login/Login'
import Register from './pages/Enter/Register/Register'
import Landing from './pages/Landing/Landing'
import SetNewPassword from './pages/Enter/SetNewPassword/SetNewPassword';
import ForgotPassword from './pages/Enter/ForgotPassword/ForgotPassword';
import PasswordResetFinish from './pages/Enter/PasswordReset/PasswordResetFinish';

// import ShoppingCart from './pages/shoppingcart/ShoppingCart';
import AuthenticatedHomepage from './pages/HomePage/Homepage';
import AuthenticatedShoppingCart from './pages/shoppingcart/ShoppingCart';
import AuthenticatedViewpage from './pages/Viewpage/Viewpage';

import AuthenticatedAccount from './pages/USER/account/Account';
import AuthenticatedWishList from './pages/wishlist/wishList'

import AuthenticatedShippingAddress from './pages/USER/shippingaddress/ShippingAddress';
import AuthenticatedShippingAddressForm from './pages/USER/shippingaddressform/ShippingAddressForm'
import AuthenticatedPaymentCardWindow from './pages/USER/paymentcardwindow/PaymentCardWindow';
import ProductViewPage from './pages/ProductViewPage/ProductViewPage';
import AuthenticatedPrePaymentPage from './pages/PrePaymentPage/PrePaymentPage'; 

import AuthenticatedPaymentGateway from './pages/PaymentGateway/PaymentGateway';
import AuthenticatedOrderConfirmationPage from './pages/OrderConfirmationPage/OrderConfirmationPage';

import AuthenticatedPayments from './pages/USER/userPayments/Payments';
import AuthenticatedorderDetails from './pages/USER/orderdetails/orderDetails';

function App() {
  const location = useLocation();

  const shouldDisplaySidebar = () => {
    const excludedPaths = ['/user-login', '/user-register', '/user-forgotpassword', '/user-passwordresetfinish', '/checkyouremail'];
    return !excludedPaths.includes(location.pathname) && !location.pathname.startsWith('/user-reset-password');
  };

  const shouldDisplayFooter = () => {
    const excludedPaths = ['/user-login', '/user-register', '/user-forgotpassword', '/user-passwordresetfinish', '/checkyouremail'];
    return !excludedPaths.includes(location.pathname) && !location.pathname.startsWith('/user-reset-password');
  };

  return (
    <>
      <div className="content-wrapper">
        {shouldDisplaySidebar() && <Navbar />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/user-login" element={<Login />} />
            <Route path="/user-register" element={<Register />} />
            <Route path="/user-forgotpassword" element={<ForgotPassword />} />
            <Route path="/user-reset-password/:resetToken" element={<SetNewPassword />} />
            <Route path="/user-passwordresetfinish" element={<PasswordResetFinish />} />

            <Route path="/user-homepage" element={<AuthenticatedHomepage />} />
            <Route path="/user-viewpage" element={<AuthenticatedViewpage />} />
            <Route path="/user-shopping-cart" element={<AuthenticatedShoppingCart />} />
            <Route path="/user-shipping-address" element={<AuthenticatedShippingAddress />} />
            <Route path="/user-shipping-address-form" element={<AuthenticatedShippingAddressForm/>} />
            <Route path="/user-payment-card-window" element={<AuthenticatedPaymentCardWindow/>} />
            <Route path="/user-pre-payment-page" element={<AuthenticatedPrePaymentPage/>} />
            <Route path="/user-product-view-page/:productId" element={<ProductViewPage/>} />

            <Route path="/payment-gateway" element={<AuthenticatedPaymentGateway/>} />
            <Route path="/order-confirmation" element={<AuthenticatedOrderConfirmationPage/>} />

            <Route path="/user-account" element={<AuthenticatedAccount />} />
            <Route path="/user-wishlist" element={<AuthenticatedWishList />} />
            <Route path="/user-payments" element={<AuthenticatedPayments />} />
            <Route path="/user-order-details" element={<AuthenticatedorderDetails />} />

            {/* Fallback route for unmatched paths */}

          </Routes>
        </main>
        {shouldDisplayFooter() && <Footer />}
      </div>
    </>
  );
}



export default App
