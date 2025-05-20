/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUpload, FaTrash, FaArrowLeft, FaBox, FaInfoCircle, FaPaperPlane } from 'react-icons/fa';
import withAuth from '../../withAuth';
import './ReturnsOrders.css';

const ReturnsOrders = ({ userId }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [returnReason, setReturnReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle consistent navigation
  const goToOrderDetails = () => {
    window.location.href = '/user-order-details';
  };

  // Fetch order details on component mount
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching order:", orderId, "for user:", userId);
        
        // First check if we have both orderId and userId
        if (!orderId || !userId) {
          setError("Missing order or user information");
          setIsLoading(false);
          return; // Don't navigate away automatically
        }
        
        const response = await axios.get(`http://localhost:8082/api/user/order/${orderId}?userId=${userId}`);
        
        if (response.data.success) {
          // Verify the order belongs to this user and is in delivered status
          const orderData = response.data.order;
          
          console.log("Order status:", orderData.order_status);
          
          if (orderData.order_status !== 'Delivered') {
            setError("This order is not eligible for return. Only delivered orders can be returned.");
            setIsLoading(false);
            return; // Don't navigate away automatically
          }
          
          setOrder(orderData);
        } else {
          setError("Failed to fetch order details. The order may not exist or you don't have permission to access it.");
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError("Error loading order data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, userId]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if adding these files would exceed the limit
    if (images.length + files.length > 3) {
      toast.warning('Maximum 3 images allowed');
      return;
    }
    
    // Check file types and sizes
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValid) toast.error(`${file.name} is not an image file`);
      if (!isValidSize) toast.error(`${file.name} exceeds 5MB limit`);
      
      return isValid && isValidSize;
    });
    
    if (validFiles.length > 0) {
      // Add new files to the existing ones
      setImages(prevImages => [...prevImages, ...validFiles]);
      
      // Generate previews for the new files
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImages(prevPreviews => [...prevPreviews, e.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove an image
  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    setPreviewImages(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  // Submit the return request
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }
    
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create form data to send files
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('userId', userId);
      formData.append('returnReason', returnReason);
      formData.append('additionalInfo', additionalInfo);
      
      // Append all images
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      console.log("Submitting return request for order:", orderId);
      
      // Submit return request
      const response = await axios.post(
        'http://localhost:8082/api/user/submit-return-request',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Return request submitted successfully');
        // Use consistent navigation
        goToOrderDetails();
      } else {
        toast.error(response.data.message || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Error submitting return request:', error);
      toast.error(error.response?.data?.message || 'Error submitting your request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="return-order-loading">
        <div className="loader"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="return-order-error">
        <FaInfoCircle />
        <h3>{error || "Order not found"}</h3>
        <p>Please check if this order is eligible for return or try again later.</p>
        <button 
          onClick={goToOrderDetails} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="return-order-container">
      <div className="return-order-header">
        <button onClick={goToOrderDetails} className="back-btn">
          <FaArrowLeft /> Back to Orders
        </button>
        <h2>Return Request</h2>
      </div>
      
      <div className="return-order-content">
        {/* Order Summary Section */}
        <div className="return-order-summary">
          <h3>Order Summary</h3>
          <div className="order-summary-details">
            <div className="order-item">
              <div className="order-item-image">
                <FaBox size={40} />
              </div>
              <div className="order-item-details">
                <h4>{order.product_name}</h4>
                <div className="order-meta">
                  <span>Order #{order.order_id}</span>
                  <span>Quantity: {order.quantity}</span>
                  <span>Size: {order.size_value}</span>
                  <span>Color: {order.color_value}</span>
                </div>
                <div className="order-price">
                  <span>Rs. {order.total_amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Return Form Section */}
        <form onSubmit={handleSubmit} className="return-form">
          <div className="form-section">
            <label htmlFor="returnReason">Reason for Return *</label>
            <select 
              id="returnReason" 
              value={returnReason} 
              onChange={(e) => setReturnReason(e.target.value)}
              required
            >
              <option value="">Select a reason</option>
              <option value="Wrong Size">Wrong Size</option>
              <option value="Defective Item">Defective/Damaged Item</option>
              <option value="Not as Described">Not as Described</option>
              <option value="Changed Mind">Changed Mind</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="form-section">
            <label htmlFor="additionalInfo">Additional Details</label>
            <textarea 
              id="additionalInfo" 
              value={additionalInfo} 
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Please provide more details about your return reason..."
              rows={4}
            />
          </div>
          
          <div className="form-section">
            <label>Upload Photos (Max 3) *</label>
            <p className="upload-help">Please upload clear images showing the issue with the product</p>
            
            <div className="image-upload-container">
              {/* Preview existing images */}
              <div className="image-previews">
                {previewImages.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                
                {/* Add more images if less than 3 */}
                {images.length < 3 && (
                  <label className="upload-image-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <FaUpload />
                      <span>Add Image</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            
            <p className="image-requirements">
              * Required: Upload at least one image. Maximum 5MB per image.
            </p>
          </div>
          
          <div className="return-policy-notice">
            <FaInfoCircle />
            <p>
              By submitting this return request, you agree to our return policy. 
              Once your request is approved, you will receive instructions on how to return the item.
            </p>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={goToOrderDetails}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
              {!isSubmitting && <FaPaperPlane />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AuthenticatedReturnsOrders = withAuth(ReturnsOrders);
export default AuthenticatedReturnsOrders;