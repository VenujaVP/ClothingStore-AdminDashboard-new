/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaBox, FaTruck, FaCheck, FaExclamationCircle, FaSpinner, 
         FaChevronDown, FaChevronUp, FaCalendarAlt, FaShoppingBag,
         FaMapMarkerAlt, FaArrowLeft, FaArrowRight, FaSearch, 
         FaInfoCircle, FaRegTimesCircle, FaClock, FaShippingFast,
         FaStar, FaBoxOpen, FaMoneyBillWave, FaListAlt, FaTimes, FaCheckCircle, FaExchangeAlt, FaUser  } from 'react-icons/fa';
import withAuth from '../../withAuth';
import './orderDetails.css';

// Status mapping to icons with updated colors
const statusIcons = {
  'unpaid': <FaMoneyBillWave className="status-icon unpaid" />,
  'to be shipped': <FaBoxOpen className="status-icon to-be-shipped" />,
  'shipped': <FaTruck className="status-icon shipped" />,
  'delivered': <FaCheck className="status-icon delivered" />,
  'processing': <FaSpinner className="status-icon processing spin" />,
  'failed': <FaExclamationCircle className="status-icon failed" />,
  'cancelled': <FaRegTimesCircle className="status-icon cancelled" />,
  'refunded': <FaMoneyBillWave className="status-icon refunded" />
};

// Add CSS classes for status colors
const statusColors = {
  'unpaid': '#ff9800',
  'to be shipped': '#2196f3',
  'shipped': '#3f51b5',
  'delivered': '#4caf50',
  'processing': '#9c27b0',
  'failed': '#f44336',
  'cancelled': '#757575',
  'refunded': '#00bcd4'
};

// Add status descriptions
const statusDescriptions = {
  'unpaid': 'Payment pending for this order',
  'to be shipped': 'Order confirmed and ready for shipping',
  'shipped': 'Order is on its way to you',
  'delivered': 'Order has been delivered successfully',
  'processing': 'Your refund request is being processed',
  'failed': 'Order processing failed',
  'cancelled': 'Order has been cancelled',
  'refunded': 'Payment has been refunded'
};

const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .status-icon.spin {
    animation: spin 1s linear infinite;
  }

  .status-icon.processing { color: #9c27b0; }
  .status-icon.refunded { color: #00bcd4; }

  .order-status-banner {
    border-left: 4px solid;
    padding: 20px;
    margin-bottom: 20px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }

  .status-info {
    flex-grow: 1;
  }

  .status-description {
    color: #666;
    margin: 8px 0;
    font-size: 0.9em;
  }

  .modal-action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .pay-btn {
    background-color: #4caf50;
    color: white;
  }

  .pay-btn:hover {
    background-color: #45a049;
  }

  .cancel-btn {
    background-color: #f44336;
    color: white;
  }

  .cancel-btn:hover {
    background-color: #d32f2f;
  }

  /* Add return button style */
  .return-btn {
    background-color: #ff9800;
    color: white;
  }

  .return-btn:hover {
    background-color: #e68a00;
  }

  .action-btn.loading {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .order-status-indicator {
    display: flex;
    align-items: center;
    font-size: 1.5em;
  }

  .order-status-indicator.large {
    font-size: 2em;
  }
`;

// Order Details Modal Component
const OrderDetailsModal = ({ 
  order, 
  onClose, 
  handleModalOverlayClick, 
  formatDate, 
  getStatusIcon, 
  handleOrderDelete, 
  closeOrderDetailsModal, 
  handlePaymentRedirect, 
  isLoading,
  navigate // Add this parameter
}) => {
  if (!order) return null;
  
  const getStatusColor = (status) => {
    return statusColors[status.toLowerCase()] || '#757575';
  };

  const getStatusDescription = (status) => {
    return statusDescriptions[status.toLowerCase()] || 'Status information not available';
  };
  
  // Function to format categories display
  const formatCategories = () => {
    let categories = order.category1 || order.category || '';
    if (order.category2) categories += ` / ${order.category2}`;
    if (order.category3) categories += ` / ${order.category3}`;
    return categories || 'N/A';
  };
  
  // Check if tracking should be shown (only for Shipped or Delivered orders)
  const showTracking = order.order_status === 'Shipped' || order.order_status === 'Delivered';
  
  return (
    <div className="modal-overlay" onClick={handleModalOverlayClick}>
      <div className="modal-content order-details-modal">
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>Order Item #{order.order_item_id || order.order_id}</h3>
            <button className="close-modal-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          
          <div className="order-status-strip" style={{ backgroundColor: getStatusColor(order.order_status) }}>
            <div className="status-icon">
              {getStatusIcon(order.order_status.toLowerCase())}
            </div>
            <div className="status-text">{order.order_status}</div>
            <div className="status-date">{formatDate(order.order_date)}</div>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="modal-body-inner">
            {/* Order Overview Section */}
            <div className="overview-section">
              <div className="overview-status-detail">
                <div className="status-circle" style={{ backgroundColor: getStatusColor(order.order_status) }}>
                  {getStatusIcon(order.order_status.toLowerCase())}
                </div>
                <div className="status-info">
                  <div className="status-title">{order.order_status}</div>
                  <div className="status-description">{getStatusDescription(order.order_status)}</div>
                </div>
              </div>
              
              {/* Action buttons based on status */}
              <div className="overview-actions">
                {order.order_status.toLowerCase() === "unpaid" && (
                  <button 
                    className={`action-btn pay-btn ${isLoading ? 'loading' : ''}`}
                    onClick={() => {
                      closeOrderDetailsModal();
                      handlePaymentRedirect(order);
                    }}
                    disabled={isLoading}
                  >
                    <FaMoneyBillWave /> 
                    {isLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                )}
                
                {(order.order_status.toLowerCase() === "unpaid" || 
                  order.order_status.toLowerCase() === "to be shipped") && (
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => handleOrderDelete(order.order_id)}
                  >
                    <FaTimes /> Cancel Order
                  </button>
                )}
                
                {/* Add this new block for Return button */}
                {order.order_status.toLowerCase() === "delivered" && (
                  <button 
                    className="action-btn return-btn"
                    onClick={() => {
                      closeOrderDetailsModal();
                      // Use window.location for consistent navigation
                      window.location.href = `/return-order/${order.order_id}`;
                    }}
                  >
                    <FaExchangeAlt /> Return Item
                  </button>
                )}
              </div>
            </div>
            
            {/* Main Content Sections */}
            <div className="detail-tabs">
              <div className="detail-tab-sections">
                {/* 1. Product Information Section */}
                <div className="detail-section product-section">
                  <div className="section-header">
                    <div className="section-icon"><FaBoxOpen /></div>
                    <h4>Product Information</h4>
                  </div>
                  
                  <div className="product-detail-content">
                    <div className="product-image-placeholder">
                      <FaBox className="placeholder-icon" />
                    </div>
                    
                    <div className="product-info-container">
                      <h5 className="product-name">{order.product_name || 'Product Name Not Available'}</h5>
                      
                      {order.product_description && (
                        <div className="product-description">
                          <p>{order.product_description}</p>
                        </div>
                      )}
                      
                      <div className="product-attributes">
                        <div className="attribute-group">
                          <div className="attribute-item">
                            <span className="attribute-label">Category</span>
                            <span className="attribute-value">{formatCategories()}</span>
                          </div>
                          
                          <div className="attribute-item">
                            <span className="attribute-label">Size</span>
                            <span className="attribute-value">{order.size_value || 'N/A'}</span>
                          </div>
                          
                          <div className="attribute-item">
                            <span className="attribute-label">Color</span>
                            <span className="attribute-value">{order.color_value || 'N/A'}</span>
                          </div>
                          
                          {order.material && (
                            <div className="attribute-item">
                              <span className="attribute-label">Material</span>
                              <span className="attribute-value">{order.material}</span>
                            </div>
                          )}
                          
                          {order.fabric_type && (
                            <div className="attribute-item">
                              <span className="attribute-label">Fabric</span>
                              <span className="attribute-value">{order.fabric_type}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="attribute-group">
                          <div className="attribute-item">
                            <span className="attribute-label">Unit Price</span>
                            <span className="attribute-value">Rs. {order.unit_price?.toFixed(2) || '0.00'}</span>
                          </div>
                          
                          <div className="attribute-item">
                            <span className="attribute-label">Quantity</span>
                            <span className="attribute-value">{order.quantity || '1'}</span>
                          </div>
                          
                          <div className="attribute-item">
                            <span className="attribute-label">Subtotal</span>
                            <span className="attribute-value">Rs. {order.total_price?.toFixed(2) || '0.00'}</span>
                          </div>
                          
                          {order.return_policy && (
                            <div className="attribute-item">
                              <span className="attribute-label">Return Policy</span>
                              <span className="attribute-value">{order.return_policy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 2. Shipping & Delivery Section */}
                <div className="detail-section shipping-section">
                  <div className="section-header">
                    <div className="section-icon"><FaShippingFast /></div>
                    <h4>Shipping & Delivery</h4>
                  </div>
                  
                  <div className="shipping-content">
                    <div className="shipping-method">
                      {order.delivery_method && (
                        <div className="delivery-badge">
                          <FaTruck className="delivery-icon" />
                          <div className="delivery-details">
                            <span className="delivery-method-name">{order.delivery_method}</span>
                            {order.delivery_description && <p>{order.delivery_description}</p>}
                          </div>
                        </div>
                      )}
                      
                      {/* Show delivery date if available */}
                      {showTracking && order.tracking_data && order.tracking_data.delivery_date ? (
                        <div className="expected-delivery">
                          <div className="delivery-date-label">Delivery Date</div>
                          <div className="delivery-date-value">{formatDate(order.tracking_data.delivery_date)}</div>
                        </div>
                      ) : order.expected_delivery_date && (
                        <div className="expected-delivery">
                          <div className="delivery-date-label">Expected Delivery</div>
                          <div className="delivery-date-value">{formatDate(order.expected_delivery_date)}</div>
                        </div>
                      )}
                      
                      {/* Show tracking number if available */}
                      {showTracking && order.tracking_data && order.tracking_data.tracking_number && (
                        <div className="tracking-number-container">
                          <div className="tracking-number-label">Tracking Number</div>
                          <div className="tracking-number-value">{order.tracking_data.tracking_number}</div>
                        </div>
                      )}
                    </div>
                    
                    {order.shipping_address && (
                      <div className="shipping-address-container">
                        <h5 className="address-title">Shipping Address</h5>
                        <div className="address-card">
                          <div className="address-icon">
                            <FaMapMarkerAlt />
                          </div>
                          <div className="address-details">
                            <div className="recipient-name">{order.shipping_address.recipient_name || 'No recipient specified'}</div>
                            <div className="address-line">{order.shipping_address.street_address || 'No street address provided'}</div>
                            {order.shipping_address.apt_suite_unit && (
                              <div className="address-line">{order.shipping_address.apt_suite_unit}</div>
                            )}
                            <div className="address-line">
                              {order.shipping_address.district || 'District N/A'}, {order.shipping_address.province || 'Province N/A'}
                            </div>
                            <div className="address-line">{order.shipping_address.zip_code || 'No ZIP code provided'}</div>
                            <div className="address-line phone">{order.shipping_address.phone_number || 'No phone number provided'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 3. Payment Information Section */}
                <div className="detail-section payment-section">
                  <div className="section-header">
                    <div className="section-icon"><FaMoneyBillWave /></div>
                    <h4>Payment Information</h4>
                  </div>
                  
                  <div className="payment-content">
                    <div className="payment-details-container">
                      <div className="payment-details">
                        <div className="payment-method-details">
                          <div className="payment-method-item">
                            <span className="payment-label">Method</span>
                            <span className="payment-value">{order.payment_method || 'Not specified'}</span>
                          </div>
                          
                          {order.payment_method_description && (
                            <div className="payment-description">
                              {order.payment_method_description}
                            </div>
                          )}
                          
                          <div className="payment-method-item">
                            <span className="payment-label">Status</span>
                            <span className={`payment-value status-${(order.payment_status || 'pending').toLowerCase()}`}>
                              {order.payment_status || 'Pending'}
                            </span>
                          </div>
                          
                          {order.transaction_reference && (
                            <div className="payment-method-item">
                              <span className="payment-label">Reference</span>
                              <span className="payment-value reference">{order.transaction_reference}</span>
                            </div>
                          )}
                          
                          {order.payment_date && (
                            <div className="payment-method-item">
                              <span className="payment-label">Payment Date</span>
                              <span className="payment-value">{formatDate(order.payment_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="payment-summary">
                        <h5 className="summary-title">Order Summary</h5>
                        <div className="summary-items">
                          <div className="summary-item">
                            <span>Product Price</span>
                            <span>Rs. {order.unit_price?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="summary-item">
                            <span>Quantity</span>
                            <span>{order.quantity || '1'}</span>
                          </div>
                          <div className="summary-item">
                            <span>Subtotal</span>
                            <span>Rs. {order.total_price?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="summary-item">
                            <span>Shipping</span>
                            <span>Rs. {order.delivery_fee?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="summary-item total">
                            <span>Total</span>
                            <span>Rs. {order.total_amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 4. Tracking History Section - Only shown for Shipped or Delivered orders */}
                {showTracking && order.tracking_history && order.tracking_history.length > 0 && (
                  <div className="detail-section tracking-section">
                    <div className="section-header">
                      <div className="section-icon"><FaListAlt /></div>
                      <h4>Tracking History</h4>
                    </div>
                    
                    <div className="tracking-content">
                      <div className="tracking-timeline">
                        {order.tracking_history.map((update, index) => (
                          <div key={update.tracking_id || index} className="tracking-event">
                            <div className="tracking-marker">
                              <div className="marker-dot"></div>
                              {index < order.tracking_history.length - 1 && <div className="marker-line"></div>}
                            </div>
                            <div className="tracking-event-content">
                              <div className="tracking-event-header">
                                <h5 className="tracking-status">{update.status || 'Status update'}</h5>
                                <span className="tracking-date">{formatDate(update.created_at)}</span>
                              </div>
                              {update.description && (
                                <p className="tracking-description">{update.description}</p>
                              )}
                              {update.processed_by && (
                                <div className="tracking-agent">
                                  <FaUser className="agent-icon" />
                                  Processed by: {update.processed_by}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Order Details Component
const OrderDetails = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const ITEMS_PER_PAGE = 5;
  
  const navigate = useNavigate();

  // Add the styles to the document
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      if (styleSheet && document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrderHistory('all');
  }, [userId]);

  // Update displayed orders when page or search term changes
  useEffect(() => {
    if (orders.length > 0) {
      applyPaginationAndSearch();
    }
  }, [currentPage, searchTerm, orders]);

  const fetchOrderHistory = async (status) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `http://localhost:8082/api/user/order-history/${userId}`;
      
      // Add status filter to query if specified
      if (status && status !== 'all') {
        url += `?status=${status}`;
      }
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        setOrders(response.data.orders);
        setAvailableStatuses(response.data.availableStatuses || [
          'Unpaid', 'To be Shipped', 'Shipped', 'Delivered', 'Processing', 'Failed', 'Cancelled', 'Refunded'
        ]);
        setTotalOrderCount(response.data.totalCount || 0);
        setStatusFilter(status || 'all');
        applyPaginationAndSearch(response.data.orders);
        setHasInitiallyLoaded(true);
      } else {
        setError('Failed to fetch order history');
        toast.error('Failed to fetch order history');
        setHasInitiallyLoaded(true);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError('An error occurred while fetching your order history');
      toast.error('Failed to load order data');
      setHasInitiallyLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPaginationAndSearch = (ordersData = orders) => {
    // Apply search filter locally
    let filteredOrders = ordersData;
    
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order => 
        (order.product_id && order.product_id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.product_name && order.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.order_id && order.order_id.toString().includes(searchTerm))
      );
    }
    
    // Calculate pagination
    setTotalPages(Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1);
    
    // Get current page items
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedOrders(filteredOrders.slice(startIndex, endIndex));
    
    // Reset to first page if no results on current page
    if (filteredOrders.length > 0 && startIndex >= filteredOrders.length) {
      setCurrentPage(1);
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setSearchTerm(''); // Clear search when changing status
    fetchOrderHistory(status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    return statusIcons[statusLower] || <FaInfoCircle className="status-icon default" />;
  };

  // Modal functions
  const openOrderDetailsModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling while modal is open
  };

  const closeOrderDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  // Handle outside click to close modal
  const handleModalOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeOrderDetailsModal();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const viewOrderDetails = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    applyPaginationAndSearch();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchOrderHistory('all');
  };

  // Handle payment redirection
  const handlePaymentRedirect = async (order) => {
    try {
      setIsLoading(true);
      toast.info("Preparing payment...");
      
      // Get available payment methods
      const paymentMethodsResponse = await axios.get('http://localhost:8082/api/user/payment-methods');
      
      if (!paymentMethodsResponse.data.success) {
        throw new Error('Failed to fetch payment methods');
      }
      
      const paymentMethods = paymentMethodsResponse.data.paymentMethods;
      
      if (!paymentMethods || paymentMethods.length === 0) {
        toast.error('No payment methods available');
        return;
      }
      
      // Default to the first online payment method
      const onlinePaymentMethod = paymentMethods.find(method => method.isOnlinePayment) || paymentMethods[0];
      
      // Prepare order data directly from the order object we already have
      const orderData = {
        customer_id: parseInt(userId),
        address_id: order.address_id,
        deliveryOptionId: order.delivery_option_id,
        paymentMethodId: onlinePaymentMethod._id,
        subtotal: parseFloat(order.unit_price * order.quantity),
        delivery_fee: parseFloat(order.delivery_fee || 0),
        total_amount: parseFloat(order.total_amount),
        totalAmount: parseFloat(order.total_amount), // Ensure both formats are available
        order_status: 'Unpaid'
      };
      
      // Navigate directly to payment gateway
      navigate('/payment-gateway', {
        state: {
          orderId: order.order_id,
          orderIds: [order.order_id],
          orderData,
          paymentMethod: onlinePaymentMethod
        }
      });
    } catch (error) {
      console.error('Error preparing payment:', error);
      toast.error('Failed to prepare payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle order deletion
  const handleOrderDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        
        const response = await axios.post(`http://localhost:8082/api/user/orders/${orderId}/cancel`, {
          userId // Include userId in the request body
        });
        
        if (response.data.success) {
          toast.success(response.data.message || 'Order cancelled successfully');
          
          // Refresh order list
          fetchOrderHistory(statusFilter);
          
          // Close modal if it's open
          if (isModalOpen) {
            closeOrderDetailsModal();
          }
        } else {
          toast.error(response.data.message || 'Failed to cancel order');
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        
        // Display more specific error messages
        if (err.response) {
          if (err.response.status === 404) {
            toast.error('Order not found or has already been processed');
          } else if (err.response.status === 403) {
            toast.error('This order cannot be cancelled in its current state');
          } else {
            toast.error(err.response.data?.message || 'Failed to cancel order');
          }
        } else if (err.request) {
          toast.error('No response from server. Please check your connection and try again.');
        } else {
          toast.error('An error occurred while cancelling the order');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Header and filter tabs section that's always shown
  const renderHeaderSection = () => (
    <div className="orders-header">
      <div className="orders-title">
        <FaBox className="header-icon" />
        <h2>My Orders</h2>
      </div>
      
      <div className="status-tabs-container">
        <button 
          className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`} 
          onClick={() => handleStatusFilterChange('all')}
        >
          <FaListAlt className="status-icon all" />
          All Orders
        </button>
        
        {availableStatuses.map(status => (
          <button
            key={status}
            className={`status-tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange(status)}
          >
            {getStatusIcon(status.toLowerCase())}
            {status}
          </button>
        ))}
      </div>
      
      <div className="orders-filters">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search in orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <FaSearch />
            </button>
          </div>
        </form>
        
        {(searchTerm || statusFilter !== 'all') && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="order-details-container">
      {renderHeaderSection()}
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <FaExclamationCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={() => fetchOrderHistory('all')} className="retry-btn">
            Try Again
          </button>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="no-orders-container">
          <div className="empty-state">
            <FaShoppingBag className="empty-icon" />
            <h3>No orders found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? "Try changing your search or filter" 
                : "You haven't placed any orders yet"}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button onClick={clearFilters} className="view-all-btn">
                View All Orders
              </button>
            ) : (
              <Link to="/shop" className="shop-now-btn">
                Shop Now
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="orders-summary">
            <span>
              Showing {displayedOrders.length} of {totalOrderCount} orders
            </span>
            {(searchTerm || statusFilter !== 'all') && (
              <span className="filtered-results">
                (Filtered results)
              </span>
            )}
          </div>
          
          <div className="orders-list">
            {displayedOrders.map(order => (
              <div key={order.order_id} className="order-card" onClick={() => openOrderDetailsModal(order)}>
                {/* Status icon column */}
                <div className="status-column">
                  <div className={`order-status-indicator status-${order.order_status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {getStatusIcon(order.order_status.toLowerCase())}
                    <span className="status-label">{order.order_status.split(' ')[0]}</span>
                  </div>
                </div>
                
                {/* Product details column */}
                <div className="product-column">
                  <div className="product-image-placeholder">
                    <FaBoxOpen />
                  </div>
                  <div className="product-text">
                    <h4 className="product-title">{order.product_name || 'Product Name Not Available'}</h4>
                    <div className="product-meta">
                      {order.size_value && (
                        <span className="product-attribute">Size: {order.size_value}</span>
                      )}
                      {order.color_value && (
                        <span className="product-attribute">Color: {order.color_value}</span>
                      )}
                      
                      {/* Show tracking number in the summary only for Shipped and Delivered orders */}
                      {(order.order_status === 'Shipped' || order.order_status === 'Delivered') && 
                       order.tracking_data && order.tracking_data.tracking_number && (
                        <span className="product-tracking">
                          <FaShippingFast className="tracking-icon" /> 
                          Tracking#: {order.tracking_data.tracking_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Order info column */}
                <div className="order-info-column">
                  <div className="order-id">#{order.order_item_id || order.order_id}</div>
                  <div className="order-date">
                    <FaCalendarAlt className="meta-icon" /> {formatDate(order.order_date)}
                  </div>
                </div>
                
                {/* Price column */}
                <div className="price-column">
                  <div className="price-amount">Rs. {order.total_amount?.toFixed(2) || '0.00'}</div>
                  <div className="qty-label">Qty: {order.quantity || '1'}</div>
                </div>
                
                {/* Status text column */}
                <div className="status-text-column">
                  <div className="status-text-value" style={{ color: statusColors[order.order_status.toLowerCase()] }}>
                    {order.order_status}
                  </div>
                  
                  {/* Show delivered date instead of expected date for delivered orders */}
                  {order.order_status === 'Delivered' && order.tracking_data && order.tracking_data.delivery_date ? (
                    <div className="delivered-date">
                      <FaCheckCircle size={10} /> Delivered: {formatDate(order.tracking_data.delivery_date)}
                    </div>
                  ) : order.expected_delivery_date && (
                    <div className="expected-date">
                      <FaClock size={10} /> Est: {formatDate(order.expected_delivery_date)}
                    </div>
                  )}
                </div>
                
                {/* Action buttons column */}
                <div className="action-column" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="action-btn view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrderDetailsModal(order);
                    }}
                  >
                    <FaInfoCircle className="btn-icon" /> Details
                  </button>
                  
                  {order.order_status.toLowerCase() === "unpaid" && (
                    <button 
                      className="action-btn pay-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaymentRedirect(order);
                      }}
                    >
                      <FaMoneyBillWave className="btn-icon" /> Pay
                    </button>
                  )}
                  
                  {(order.order_status.toLowerCase() === "unpaid" || 
                    order.order_status.toLowerCase() === "to be shipped") && (
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderDelete(order.order_id);
                      }}
                    >
                      <FaTimes className="btn-icon" /> Cancel
                    </button>
                  )}
                  
                  {/* Add return button for delivered orders */}
                  {order.order_status.toLowerCase() === "delivered" && (
                    <button 
                      className="action-btn return-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use window.location for consistent navigation
                        window.location.href = `/return-order/${order.order_id}`;
                      }}
                    >
                      <FaExchangeAlt className="btn-icon" /> Return
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <FaArrowLeft /> Prev
              </button>
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next <FaArrowRight />
              </button>
            </div>
          )}
        </>
      )}
      
      {isModalOpen && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={closeOrderDetailsModal}
          handleModalOverlayClick={handleModalOverlayClick}
          formatDate={formatDate}
          getStatusIcon={getStatusIcon}
          handleOrderDelete={handleOrderDelete}
          closeOrderDetailsModal={closeOrderDetailsModal}
          handlePaymentRedirect={handlePaymentRedirect}
          isLoading={isLoading}
          navigate={navigate} // Add this line to pass navigate function
        />
      )}
    </div>
  );
};

const AuthenticatedOrderDetails = withAuth(OrderDetails);
export default AuthenticatedOrderDetails;