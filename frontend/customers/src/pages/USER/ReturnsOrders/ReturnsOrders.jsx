//pages/USER/ReturnsOrders/ReturnsOrders.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaUpload, FaTrash, FaArrowLeft, FaBox, FaInfoCircle,
  FaPaperPlane, FaCheck, FaTimes, FaClock, FaHistory,
  FaExclamationTriangle, FaFileAlt, FaImage 
} from 'react-icons/fa';
import withAuth from '../../withAuth';
import './ReturnsOrders.css';

const ReturnsOrders = ({ userId }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [existingReturns, setExistingReturns] = useState([]);
  const [showExistingReturns, setShowExistingReturns] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReturns, setIsLoadingReturns] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Function to handle consistent navigation
  const goToOrderDetails = () => {
    window.location.href = '/user-order-details';
  };

  // Toggle view between new return form and existing returns
  const toggleView = () => {
    if (!showExistingReturns && !existingReturns.length) {
      fetchExistingReturns();
    }
    setShowExistingReturns(prev => !prev);
  };

  // Fetch existing return requests
  const fetchExistingReturns = async () => {
    if (!userId) return;
    
    setIsLoadingReturns(true);
    try {
      const response = await axios.get(`http://localhost:8082/api/user/return-requests/${userId}`);
      if (response.data.success) {
        setExistingReturns(response.data.returnRequests);
      } else {
        toast.error('Failed to load your return requests');
      }
    } catch (error) {
      console.error('Error fetching return requests:', error);
      toast.error('Error loading your return requests');
    } finally {
      setIsLoadingReturns(false);
    }
  };

  // Fetch order details on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // If we have an orderId, fetch specific order for return form
      if (orderId) {
        try {
          console.log("Fetching order:", orderId, "for user:", userId);
          
          if (!userId) {
            setError("User information missing");
            setIsLoading(false);
            return; 
          }
          
          const response = await axios.get(`http://localhost:8082/api/user/order/${orderId}?userId=${userId}`);
          
          if (response.data.success) {
            const orderData = response.data.order;
            console.log("Order status:", orderData.order_status);
            
            if (orderData.order_status !== 'Delivered') {
              setError("This order is not eligible for return. Only delivered orders can be returned.");
            } else {
              setOrder(orderData);
            }
          } else {
            setError("Failed to fetch order details.");
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
          setError("Error loading order data.");
        }
      } 
      // If no orderId, we're in the returns history view
      else {
        setShowExistingReturns(true);
        await fetchExistingReturns();
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [orderId, userId]);

  // Log the current view (return form or history)
  useEffect(() => {
    console.log('Current view:', showExistingReturns ? 'Return History' : 'Return Form');
  }, [showExistingReturns]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 3) {
      toast.warning('Maximum 3 images allowed');
      return;
    }
    
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024;
      
      if (!isValid) toast.error(`${file.name} is not an image file`);
      if (!isValidSize) toast.error(`${file.name} exceeds 5MB limit`);
      
      return isValid && isValidSize;
    });
    
    if (validFiles.length > 0) {
      setImages(prevImages => [...prevImages, ...validFiles]);
      
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
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('userId', userId);
      formData.append('returnReason', returnReason);
      formData.append('additionalInfo', additionalInfo);
      
      images.forEach((image) => {
        formData.append('images', image);
      });
      
      console.log("Submitting return request for order:", orderId);
      
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

  // Open image in modal
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Close image modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'var(--color-warning)';
      case 'Approved': return 'var(--color-success)';
      case 'Rejected': return 'var(--color-danger)';
      case 'Completed': return 'var(--color-primary)';
      default: return 'var(--color-text-secondary)';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FaClock />;
      case 'Approved': return <FaCheck />;
      case 'Rejected': return <FaTimes />;
      case 'Completed': return <FaCheck />;
      default: return <FaInfoCircle />;
    }
  };

  if (isLoading) {
    return (
      <div className="return-order-loading">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show error state
  if (orderId && (error || !order)) {
    return (
      <div className="return-order-error">
        <FaExclamationTriangle size={32} />
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

  // Show returns history view
  if (showExistingReturns) {
    return (
      <div className="return-order-container return-history-container">
        <div className="return-order-header">
          {orderId && (
            <button 
              onClick={() => setShowExistingReturns(false)} 
              className="toggle-btn"
            >
              <FaFileAlt /> New Return Request
            </button>
          )}
          {!orderId && (
            <button onClick={goToOrderDetails} className="back-btn">
              <FaArrowLeft /> Back to Orders
            </button>
          )}
          <h2>My Return Requests</h2>
        </div>
        
        {isLoadingReturns ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading your return requests...</p>
          </div>
        ) : existingReturns.length === 0 ? (
          <div className="no-returns-container">
            <FaInfoCircle size={32} />
            <h3>No Return Requests Found</h3>
            <p>You haven't submitted any return requests yet.</p>
          </div>
        ) : (
          <div className="returns-list">
            {existingReturns.map(returnRequest => (
              <div key={returnRequest.return_id} className="return-card">
                <div className="return-header">
                  <div className="return-id">Return #{returnRequest.return_id}</div>
                  <div 
                    className="return-status" 
                    style={{ backgroundColor: getStatusColor(returnRequest.return_status) }}
                  >
                    {getStatusIcon(returnRequest.return_status)} {returnRequest.return_status}
                  </div>
                </div>
                
                <div className="return-content">
                  <div className="return-product-info">
                    <div className="product-icon">
                      <FaBox size={32} />
                    </div>
                    <div className="product-details">
                      <h4>{returnRequest.product_name}</h4>
                      <div className="product-meta">
                        <span>Order #{returnRequest.order_id}</span>
                        <span>Quantity: {returnRequest.quantity}</span>
                        {returnRequest.size_value && (
                          <span>Size: {returnRequest.size_value}</span>
                        )}
                        {returnRequest.color_value && (
                          <span>Color: {returnRequest.color_value}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="return-details">
                    <div className="return-reason">
                      <strong>Reason:</strong> {returnRequest.return_reason}
                    </div>
                    <div className="return-dates">
                      <div><strong>Requested on:</strong> {returnRequest.formatted_created_at}</div>
                      <div><strong>Order date:</strong> {returnRequest.formatted_order_date}</div>
                    </div>
                    
                    {returnRequest.admin_notes && (
                      <div className="admin-notes">
                        <strong>Admin Notes:</strong> {returnRequest.admin_notes}
                      </div>
                    )}
                    
                    <div className="return-status-description">
                      {returnRequest.status_description}
                    </div>
                  </div>
                  
                  {returnRequest.images && returnRequest.images.length > 0 && (
                    <div className="return-images">
                      <h5>Return Images</h5>
                      <div className="image-thumbnails">
                        {returnRequest.images.map((image, index) => (
                          <div 
                            key={index} 
                            className="image-thumbnail" 
                            onClick={() => openImageModal(image.url)}
                          >
                            <img 
                              src={image.url} 
                              alt={`Return image ${index + 1}`} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Image modal */}
        {selectedImage && (
          <div className="image-modal-overlay" onClick={closeImageModal}>
            <div className="image-modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={closeImageModal}>
                <FaTimes />
              </button>
              <img src={selectedImage} alt="Return item" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show return request form
  return (
    <div className="return-order-container">
      <div className="return-order-header">
        <button onClick={goToOrderDetails} className="back-btn">
          <FaArrowLeft /> Back to Orders
        </button>
        <h2>Return Request</h2>
        <button onClick={toggleView} className="toggle-btn">
          <FaHistory /> View My Returns
        </button>
      </div>
      
      {/* Debug info - remove after testing */}
      <div style={{background: "#f8f9fa", padding: "10px", marginBottom: "15px"}}>
        Debug: {order ? `Order loaded: ${order.order_id}` : 'No order data'} | 
        Form view: {showExistingReturns ? 'No' : 'Yes'}
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
                <span>Rs. {order.total_amount ? Number(order.total_amount).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Return Form Section */}
        <form onSubmit={handleSubmit} className="return-form" style={{marginBottom: "100px"}}>
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
              style={{
                backgroundColor: "#4a90e2",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Return Request'} 
              {!isSubmitting && <span>📤</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AuthenticatedReturnsOrders = withAuth(ReturnsOrders);
export default AuthenticatedReturnsOrders;