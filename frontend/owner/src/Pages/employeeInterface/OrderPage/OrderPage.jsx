/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState, useEffect } from 'react';
import './OrderPage.css';
import { 
  FaSearch, FaFilter, FaEye, FaShippingFast, FaBoxOpen, 
  FaTimesCircle, FaTimes, FaCheck, FaSyncAlt, FaEdit,  // Replace FaRefresh with FaSyncAlt
  FaExclamationCircle, FaTruck, FaMapMarkerAlt, FaBox
} from 'react-icons/fa';
import axios from 'axios';
import { Snackbar, Alert, Tab, Tabs, Badge } from '@mui/material';

const OrderPage = ({ userId }) => {
  // State for orders data
  const [toBeShippedOrders, setToBeShippedOrders] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // State for current tab
  const [activeTab, setActiveTab] = useState(0);
  
  // State for modals
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTrackingEditModalOpen, setIsTrackingEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  
  // State for alerts
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch "To Be Shipped" orders
  const fetchToBeShippedOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8082/api/employee/orders/to-be-shipped', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setToBeShippedOrders(response.data.orders);
        if (activeTab === 0) {
          setFilteredOrders(response.data.orders);
        }
      } else {
        showAlert('Failed to fetch orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching to-be-shipped orders:', error);
      showAlert(error.response?.data?.message || 'Error fetching orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shipped orders
  const fetchShippedOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8082/api/employee/orders/shipped', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setShippedOrders(response.data.orders);
        if (activeTab === 1) {
          setFilteredOrders(response.data.orders);
        }
      } else {
        showAlert('Failed to fetch shipped orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching shipped orders:', error);
      showAlert(error.response?.data?.message || 'Error fetching shipped orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8082/api/employee/orders/details/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrderDetails(response.data.order);
        setIsDetailModalOpen(true);
      } else {
        showAlert('Failed to fetch order details', 'error');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showAlert(error.response?.data?.message || 'Error fetching order details', 'error');
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchToBeShippedOrders();
    fetchShippedOrders();
  }, []);

  // Update filtered orders when tab changes
  useEffect(() => {
    if (activeTab === 0) {
      setFilteredOrders(toBeShippedOrders);
    } else {
      setFilteredOrders(shippedOrders);
    }
  }, [activeTab, toBeShippedOrders, shippedOrders]);

  // Handle search functionality
  useEffect(() => {
    const currentOrders = activeTab === 0 ? toBeShippedOrders : shippedOrders;
    
    if (searchTerm.trim() === '') {
      setFilteredOrders(currentOrders);
    } else {
      const filtered = currentOrders.filter(order => 
        order.order_item_id.toString().includes(searchTerm) ||
        order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activeTab === 1 && order.tracking_number?.includes(searchTerm))
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, activeTab, toBeShippedOrders, shippedOrders]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
  };

  // Function to handle view order details
  const handleViewOrder = (order) => {
    fetchOrderDetails(order.order_id);
  };

  // Function to handle shipping process
  const handleShipOrder = (order) => {
    setSelectedOrder(order);
    setTrackingNumber('');
    setIsShippingModalOpen(true);
  };

  // Function to handle edit tracking
  const handleEditTracking = (order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setIsTrackingEditModalOpen(true);
  };

  // Function to confirm shipping
  const confirmShipping = async () => {
    if (!trackingNumber.trim()) {
      showAlert('Tracking number is required', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const employeeId = userId;

      const response = await axios.post(
        'http://localhost:8082/api/employee/orders/process-shipping',
        {
          orderId: selectedOrder.order_id,
          trackingNumber,
          employeeId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        showAlert('Order has been processed and marked as shipped', 'success');
        setIsShippingModalOpen(false);
        fetchToBeShippedOrders();
        fetchShippedOrders();
      } else {
        showAlert(response.data.message || 'Failed to process order', 'error');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      showAlert(error.response?.data?.message || 'Error processing order', 'error');
    }
  };

  // Function to update tracking number
  const confirmTrackingUpdate = async () => {
    if (!trackingNumber.trim()) {
      showAlert('Tracking number is required', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const employeeId = userId;

      const response = await axios.post(
        'http://localhost:8082/api/employee/orders/update-tracking',
        {
          orderId: selectedOrder.order_id,
          trackingNumber,
          employeeId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        showAlert('Tracking number updated successfully', 'success');
        setIsTrackingEditModalOpen(false);
        fetchShippedOrders();
      } else {
        showAlert(response.data.message || 'Failed to update tracking number', 'error');
      }
    } catch (error) {
      console.error('Error updating tracking number:', error);
      showAlert(error.response?.data?.message || 'Error updating tracking number', 'error');
    }
  };

  // Helper function to show alerts
  const showAlert = (message, severity) => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  // Handle alert close
  const handleAlertClose = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render order table based on active tab
  const renderOrderTable = () => {
    return (
      <div className="order-table-container">
        <table className="order-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Product</th>
              <th>Recipient</th>
              {activeTab === 1 && <th>Tracking</th>}
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.order_id}>
                <td className="order-id-cell">#{order.order_item_id.toString().padStart(4, '0')}</td>
                <td>{formatDate(order.order_date)}</td>
                <td>
                  <div className="product-info">
                    <div className="product-name">{order.product_name || 'N/A'}</div>
                    <div className="product-meta">
                      {order.size_value && <span>Size: {order.size_value}</span>}
                      {order.color_value && <span>Color: {order.color_value}</span>}
                      <span>Qty: {order.quantity}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="recipient-info">
                    <div>{order.recipient_name || 'N/A'}</div>
                    <div>{order.phone_number || 'N/A'}</div>
                  </div>
                </td>
                {activeTab === 1 && (
                  <td className="tracking-cell">
                    {order.tracking_number || 'N/A'}
                  </td>
                )}
                <td className="amount-cell">Rs. {parseFloat(order.total_amount).toFixed(2)}</td>
                <td className="action-buttons">
                  <button 
                    className="action-btn view-btn" 
                    title="View Order Details"
                    onClick={() => handleViewOrder(order)}
                  >
                    <FaEye />
                  </button>
                  
                  {activeTab === 0 ? (
                    <button 
                      className="action-btn ship-btn" 
                      title="Process Shipping"
                      onClick={() => handleShipOrder(order)}
                    >
                      <FaShippingFast />
                    </button>
                  ) : (
                    <button 
                      className="action-btn edit-btn" 
                      title="Edit Tracking Number"
                      onClick={() => handleEditTracking(order)}
                    >
                      <FaEdit />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="order-page">
      <div className="page-header">
        <h2>Order Management</h2>
        <p>Process and track customer orders</p>
      </div>

      <div className="tabs-container">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          className="order-tabs"
        >
          <Tab 
            label={
              <Badge badgeContent={toBeShippedOrders.length} color="error" max={99}>
                <span className="tab-label"><FaBoxOpen className="tab-icon" /> To Be Shipped</span>
              </Badge>
            } 
            className="order-tab"
          />
          <Tab 
            label={
              <span className="tab-label"><FaShippingFast className="tab-icon" /> Shipped Orders</span>
            }
            className="order-tab"
          />
        </Tabs>
      </div>

      <div className="order-tools">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 0 ? 'pending' : 'shipped'} orders...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="refresh-button"
          onClick={() => activeTab === 0 ? fetchToBeShippedOrders() : fetchShippedOrders()}
        >
          <FaSyncAlt /> Refresh  {/* Replace FaRefresh with FaSyncAlt here */}
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          {activeTab === 0 ? (
            <>
              <FaBoxOpen className="empty-icon" />
              <h3>No Orders To Ship</h3>
              <p>All orders have been processed. Check back later for new orders.</p>
            </>
          ) : (
            <>
              <FaTruck className="empty-icon" />
              <h3>No Shipped Orders</h3>
              <p>There are no shipped orders to display.</p>
            </>
          )}
        </div>
      ) : (
        renderOrderTable()
      )}

      {/* View Order Details Modal */}
      {isDetailModalOpen && orderDetails && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{orderDetails.order_item_id.toString().padStart(4, '0')} Details</h3>
              <button className="close-btn" onClick={() => setIsDetailModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detail-status">
                <div className={`status-badge ${orderDetails.order_status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {orderDetails.order_status === 'To be Shipped' ? (
                    <><FaBoxOpen className="status-icon" /> To Be Shipped</>
                  ) : (
                    <><FaTruck className="status-icon" /> Shipped</>
                  )}
                </div>
                
                {orderDetails.order_status === 'Shipped' && orderDetails.tracking_number && (
                  <div className="tracking-info">
                    <span className="tracking-label">Tracking Number:</span>
                    <span className="tracking-value">{orderDetails.tracking_number}</span>
                  </div>
                )}
              </div>
              
              <div className="detail-sections">
                <div className="detail-section">
                  <h4><FaBox /> Product Information</h4>
                  <div className="detail-content">
                    <div className="detail-row">
                      <span className="detail-label">Product:</span>
                      <span className="detail-value">{orderDetails.product_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{orderDetails.Category1}</span>
                    </div>
                    {orderDetails.size_value && (
                      <div className="detail-row">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{orderDetails.size_value}</span>
                      </div>
                    )}
                    {orderDetails.color_value && (
                      <div className="detail-row">
                        <span className="detail-label">Color:</span>
                        <span className="detail-value">{orderDetails.color_value}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{orderDetails.quantity}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Unit Price:</span>
                      <span className="detail-value">Rs. {parseFloat(orderDetails.unit_price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4><FaMapMarkerAlt /> Shipping Information</h4>
                  <div className="detail-content">
                    <div className="detail-row">
                      <span className="detail-label">Recipient:</span>
                      <span className="detail-value">{orderDetails.recipient_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{orderDetails.phone_number}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">
                        {orderDetails.street_address}
                        {orderDetails.apt_suite_unit ? `, ${orderDetails.apt_suite_unit}` : ''}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">
                        {orderDetails.district}, {orderDetails.province}, {orderDetails.zip_code}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Delivery Method:</span>
                      <span className="detail-value">{orderDetails.delivery_option_name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h4>Order Summary</h4>
                  <div className="detail-content">
                    <div className="detail-row">
                      <span className="detail-label">Order Date:</span>
                      <span className="detail-value">{formatDate(orderDetails.order_date)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">{orderDetails.payment_method_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Subtotal:</span>
                      <span className="detail-value">Rs. {parseFloat(orderDetails.total_price).toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Shipping Fee:</span>
                      <span className="detail-value">Rs. {parseFloat(orderDetails.delivery_fee).toFixed(2)}</span>
                    </div>
                    <div className="detail-row total-row">
                      <span className="detail-label">Total:</span>
                      <span className="detail-value total-value">Rs. {parseFloat(orderDetails.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </button>
              
              {orderDetails.order_status === 'To be Shipped' && (
                <button 
                  className="confirm-btn" 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleShipOrder(orderDetails);
                  }}
                >
                  <FaShippingFast /> Process Shipping
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {isShippingModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsShippingModalOpen(false)}>
          <div className="shipping-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Process Shipping</h3>
              <button className="close-btn" onClick={() => setIsShippingModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="order-identifier">
                <div className="order-number">Order #{selectedOrder.order_item_id.toString().padStart(4, '0')}</div>
                <div className="order-date">{formatDate(selectedOrder.order_date)}</div>
              </div>
              
              <div className="shipping-product-info">
                <div className="product-icon"><FaBox /></div>
                <div className="product-details">
                  <div className="product-name">{selectedOrder.product_name}</div>
                  <div className="product-meta">
                    {selectedOrder.size_value && <span>Size: {selectedOrder.size_value}</span>}
                    {selectedOrder.color_value && <span>Color: {selectedOrder.color_value}</span>}
                    <span>Qty: {selectedOrder.quantity}</span>
                  </div>
                </div>
                <div className="product-price">
                  Rs. {parseFloat(selectedOrder.total_amount).toFixed(2)}
                </div>
              </div>
              
              <div className="shipping-to">
                <h4><FaMapMarkerAlt /> Shipping To</h4>
                <div className="recipient-details">
                  <div className="recipient-name">{selectedOrder.recipient_name}</div>
                  <div className="recipient-phone">{selectedOrder.phone_number}</div>
                </div>
              </div>
              
              <div className="tracking-input">
                <label htmlFor="tracking-number">Tracking Number <span className="required">*</span></label>
                <input
                  id="tracking-number"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter shipping tracking number"
                  required
                />
                <div className="tracking-help">
                  Enter the tracking number provided by the shipping carrier
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setIsShippingModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={confirmShipping}
                disabled={!trackingNumber.trim()}
              >
                <FaCheck /> Confirm Shipping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tracking Modal */}
      {isTrackingEditModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsTrackingEditModalOpen(false)}>
          <div className="tracking-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Tracking Number</h3>
              <button className="close-btn" onClick={() => setIsTrackingEditModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="order-identifier">
                <div className="order-number">Order #{selectedOrder.order_item_id.toString().padStart(4, '0')}</div>
                <div className="order-date">{formatDate(selectedOrder.order_date)}</div>
              </div>
              
              <div className="current-tracking">
                <h4>Current Tracking Number</h4>
                <div className="tracking-display">
                  {selectedOrder.tracking_number || 'No tracking number assigned'}
                </div>
              </div>
              
              <div className="tracking-input">
                <label htmlFor="new-tracking-number">New Tracking Number <span className="required">*</span></label>
                <input
                  id="new-tracking-number"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter new tracking number"
                  required
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setIsTrackingEditModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={confirmTrackingUpdate}
                disabled={!trackingNumber.trim()}
              >
                <FaCheck /> Update Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div>
          <Alert 
            onClose={handleAlertClose} 
            severity={alert.severity} 
            sx={{ 
              width: '100%',
              fontWeight: alert.severity === 'error' ? 'bold' : 'normal',
              backgroundColor: alert.severity === 'success' ? '#23b893' : undefined,
              color: alert.severity === 'success' ? 'white' : undefined
            }}
          >
            {alert.message}
          </Alert>
        </div>
      </Snackbar>
    </div>
  );
};

export default OrderPage;
