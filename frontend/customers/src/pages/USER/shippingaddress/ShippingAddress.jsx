// ./pages/USER/shippingaddress/ShippingAddress

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ShippingAddress.css';
import withAuth from '../../withAuth';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ShippingAddress = ({ userId }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  // Fetch addresses from backend
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8082/api/user/addresses/${userId}`);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch addresses');
        }

        setAddresses(response.data.addresses);
        setError(null);
      } catch (err) {
        console.error('Error fetching addresses:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load addresses');
        toast.error('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

  // Handle delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      setDeletingId(addressId);
      const response = await axios.delete(
        `http://localhost:8082/api/user/address/${userId}/${addressId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // Update frontend state
      setAddresses(addresses.filter(address => address.address_id !== addressId));
      toast.success('Address deleted successfully');
    } catch (err) {
      console.error('Error deleting address:', err);
      toast.error(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  // Navigate to add new address form
  const handleAddNewAddress = () => {
    navigate('/user-shipping-address-form');
  };

  if (loading) {
    return (
      <div className="shipping-address-page">
        <div className="loading-container">
          <p>Loading addresses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shipping-address-page">
        <div className="error-container">
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shipping-address-page">
      <div className="shipping-header">
        <h2>Shipping Address</h2>
        <button 
          className="add-address-btn"
          onClick={handleAddNewAddress}
        >
          + Add New Address
        </button>
      </div>

      <div className="address-list">
        {addresses.length === 0 ? (
          <div className="no-addresses">
            <p>No addresses found. Please add a shipping address.</p>
            <button 
              className="add-first-address-btn"
              onClick={handleAddNewAddress}
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          addresses.map(address => (
            <div key={address.address_id} className="address-card">
              <div className="address-details">
                <h3>{address.contact_name}</h3>
                <p>{address.street_address}{address.apt_suite_unit ? `, ${address.apt_suite_unit}` : ''}</p>
                <p>{address.district}, {address.province} {address.zip_code}</p>
                <p>Phone: +94 {address.mobile_number}</p>
                {address.is_default && (
                  <div className="default-badge">Default Address</div>
                )}
              </div>
              <div className="address-actions">
              <button
                className="edit-btn"
                onClick={() => navigate('/user-shipping-address-form', {
                  state: { 
                    addressData: address,
                    isEditing: true 
                  }
                })}
              >
                Edit
              </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteAddress(address.address_id)}
                  disabled={deletingId === address.address_id}
                >
                  {deletingId === address.address_id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AuthenticatedShippingAddress = withAuth(ShippingAddress);  
export default AuthenticatedShippingAddress;