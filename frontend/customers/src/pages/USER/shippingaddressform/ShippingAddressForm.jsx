// ./pages/USER/shippingaddressform/ShippingAddressForm

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ShippingAddressForm.css';
import withAuth from '../../withAuth';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ShippingAddressForm = ({ userId }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [addressId, setAddressId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    contactName: '',
    mobileNumber: '',
    streetAddress: '',
    aptSuiteUnit: '',
    province: '',
    district: '',
    zipCode: '',
    isDefaultAddress: false,
  });

  const provinces = [
    'Western Province',
    'Central Province',
    'Southern Province',
    'Northern Province',
    'Eastern Province',
    'North Western Province',
    'North Central Province',
    'Uva Province',
    'Sabaragamuwa Province',
  ];

  const districts = {
    'Western Province': ['Colombo', 'Gampaha', 'Kalutara'],
    'Central Province': ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern Province': ['Galle', 'Matara', 'Hambantota'],
    'Northern Province': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
    'Eastern Province': ['Trincomalee', 'Batticaloa', 'Ampara'],
    'North Western Province': ['Kurunegala', 'Puttalam'],
    'North Central Province': ['Anuradhapura', 'Polonnaruwa'],
    'Uva Province': ['Badulla', 'Monaragala'],
    'Sabaragamuwa Province': ['Ratnapura', 'Kegalle'],
  };

  // Initialize form data if in edit mode
  useEffect(() => {
    if (state?.addressData) {
      const address = state.addressData;
      setIsEditMode(true);
      setAddressId(address.address_id);
      setFormData({
        contactName: address.contact_name,
        mobileNumber: address.mobile_number,
        streetAddress: address.street_address,
        aptSuiteUnit: address.apt_suite_unit || '',
        province: address.province,
        district: address.district,
        zipCode: address.zip_code,
        isDefaultAddress: address.is_default,
      });
    }
  }, [state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const addressData = {
        customerID: userId,
        contact_name: formData.contactName,
        mobile_number: formData.mobileNumber,
        street_address: formData.streetAddress,
        apt_suite_unit: formData.aptSuiteUnit,
        province: formData.province,
        district: formData.district,
        zip_code: formData.zipCode,
        is_default: formData.isDefaultAddress
      };

      if (isEditMode) {
        // Update existing address
        const response = await axios.put(
          `http://localhost:8082/api/user/address/${userId}/${addressId}`,
          addressData
        );
        toast.success('Address updated successfully!');
      } else {
        // Create new address
        const response = await axios.post(
          'http://localhost:8082/api/user/shipping-address',
          addressData
        );
        toast.success('Address added successfully!');
      }

      navigate('/user-shipping-address'); // Redirect back to addresses list
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shipping-address-page">
      <h2>{isEditMode ? 'Edit' : 'Add New'} Shipping Address</h2>
      {isEditMode && <p className="edit-mode-indicator">Editing existing address</p>}
      
      <form onSubmit={handleSubmit} className="address-form">
        {/* Contact Information */}
        <div className="form-group">
          <label htmlFor="contactName">Contact Name <span className="required">*</span></label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mobileNumber">Mobile Number <span className="required">*</span></label>
            <div className="input-with-prefix">
              <span className="prefix">+94</span>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="form-group">
          <label htmlFor="streetAddress">Street Address <span className="required">*</span></label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="aptSuiteUnit">Apt, Suite, Unit, etc (optional)</label>
          <input
            type="text"
            id="aptSuiteUnit"
            name="aptSuiteUnit"
            value={formData.aptSuiteUnit}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="province">Province <span className="required">*</span></label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district">District <span className="required">*</span></label>
            <select
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              required
              disabled={!formData.province || isSubmitting}
            >
              <option value="">Select District</option>
              {formData.province &&
                districts[formData.province].map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">ZIP Code <span className="required">*</span></label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Default Address Checkbox */}
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="isDefaultAddress"
            name="isDefaultAddress"
            checked={formData.isDefaultAddress}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <label htmlFor="isDefaultAddress">Set as default shipping address</label>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </button>
          <button 
            type="button" 
            className="cancel-btn"
            disabled={isSubmitting}
            onClick={() => navigate('/user-shipping-address')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const AuthenticatedShippingAddressForm = withAuth(ShippingAddressForm);
export default AuthenticatedShippingAddressForm;