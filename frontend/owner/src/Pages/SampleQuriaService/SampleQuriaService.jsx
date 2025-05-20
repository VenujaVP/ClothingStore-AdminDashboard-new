// pages/SampleQuriaService/SampleQuriaService.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState, useEffect, useRef } from 'react';
import './SampleQuriaService.css';
import axios from 'axios';
import { 
  FaBox, FaCheckCircle, FaTimes, FaTruck, FaMapMarkerAlt,
  FaSearch, FaBoxOpen, FaCheck, FaSyncAlt, FaEye, FaSort, 
  FaSortUp, FaSortDown, FaBuilding, FaCity, FaRoad, FaCalendarAlt,
  FaUser, FaClipboardCheck
} from 'react-icons/fa';
import { Tabs, Tab, Badge, Snackbar, Alert, Tooltip } from '@mui/material';

const SampleQuriaService = ({ userId }) => {
  // State for orders data
  const [shippedOrders, setShippedOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // State for current tab
  const [activeTab, setActiveTab] = useState(0);
  
  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // State for order details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'order_item_id',
    direction: 'ascending'
  });
  
  // State for alerts
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Reference for the print section
  const printRef = useRef(null);

  // Fetch "Shipped" orders
  const fetchShippedOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8082/api/courier/orders/shipped', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const orders = response.data.orders;
        setShippedOrders(orders);
        
        // If we're on the Shipped tab, update filtered orders
        if (activeTab === 0) {
          setFilteredOrders(orders);
          applySearch(orders);
          applySort(orders);
        }
      } else {
        showAlert('Failed to fetch shipped orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching shipped orders:', error);
      showAlert(error.response?.data?.message || 'Error fetching orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch "Delivered" orders
  const fetchDeliveredOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8082/api/courier/orders/delivered', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const orders = response.data.orders;
        setDeliveredOrders(orders);
        
        // If we're on the Delivered tab, update filtered orders
        if (activeTab === 1) {
          setFilteredOrders(orders);
          applySearch(orders);
          applySort(orders);
        }
      } else {
        showAlert('Failed to fetch delivered orders', 'error');
      }
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
      showAlert(error.response?.data?.message || 'Error fetching orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchShippedOrders(), fetchDeliveredOrders()])
      .finally(() => setLoading(false));
  }, []);

  // Apply search filter to orders
  const applySearch = (orders) => {
    if (!searchTerm.trim()) {
      return orders;
    }
    
    return orders.filter(order => 
      order.order_item_id?.toString().includes(searchTerm) ||
      order.tracking_number?.toString().includes(searchTerm) ||
      order.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.full_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.province?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.zip_code?.includes(searchTerm)
    );
  };

  // Apply sorting to orders
  const applySort = (orders) => {
    if (!sortConfig.key || !orders || orders.length === 0) {
      return orders;
    }
    
    return [...orders].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle special date fields
      if (sortConfig.key === 'shipping_date' || sortConfig.key === 'delivery_date') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }
      
      // Handle numeric fields
      if (sortConfig.key === 'order_item_id') {
        aValue = parseInt(aValue, 10);
        bValue = parseInt(bValue, 10);
      }
      
      // Handle text fields (case insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  // Update filtered orders when search, sort or tab changes
  useEffect(() => {
    // Get the appropriate order list based on active tab
    const currentOrders = activeTab === 0 ? shippedOrders : deliveredOrders;
    
    // Apply filters in sequence
    let result = applySearch(currentOrders);
    result = applySort(result);
    
    // Update filtered orders
    setFilteredOrders(result);
  }, [searchTerm, sortConfig, activeTab, shippedOrders, deliveredOrders]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
    setSortConfig({
      key: 'order_item_id',
      direction: 'ascending'
    });
    
    // Set the new filtered orders immediately
    setFilteredOrders(newValue === 0 ? shippedOrders : deliveredOrders);
    
    // Refresh data for the selected tab
    if (newValue === 0) {
      fetchShippedOrders();
    } else {
      fetchDeliveredOrders();
    }
  };

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon for column
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FaSort className="sort-icon" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <FaSortUp className="sort-icon active" /> : 
      <FaSortDown className="sort-icon active" />;
  };

  // Function to show order details
  const handleViewDetails = (order) => {
    setOrderDetails(order);
    setIsDetailsModalOpen(true);
  };

  // Function to handle opening confirmation modal
  const handleConfirmDelivery = (order) => {
    setSelectedOrder(order);
    setIsConfirmModalOpen(true);
  };

  // Function to confirm delivery (simplified)
  const confirmDelivery = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `http://localhost:8082/api/courier/orders/${selectedOrder.order_id}/deliver`,
        {}, // No data needed in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        showAlert('Order has been marked as delivered', 'success');
        setIsConfirmModalOpen(false);
        
        // Refresh both tabs to ensure accurate counts and data
        fetchShippedOrders();
        fetchDeliveredOrders();
      } else {
        showAlert(response.data.message || 'Failed to update order status', 'error');
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      showAlert(error.response?.data?.message || 'Error confirming delivery', 'error');
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
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format short address for table display
  const formatShortAddress = (order) => {
    return `${order.street_address}, ${order.district}`;
  };

  // Format full address for details
  const formatFullAddress = (order) => {
    let address = order.street_address;
    if (order.apt_suite_unit) address += `, ${order.apt_suite_unit}`;
    address += `, ${order.district}, ${order.province}, ${order.zip_code}`;
    return address;
  };

  // Print delivery slip
  const printDeliverySlip = () => {
    if (!orderDetails) return;
    
    const printContent = document.getElementById('print-delivery-slip');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Re-add event listeners by re-rendering
    window.location.reload();
  };

  // Get current tab contents for empty state display
  const currentTabData = activeTab === 0 ? 
    { orders: shippedOrders, status: 'Pending Deliveries', icon: <FaTruck className="empty-icon" /> } : 
    { orders: deliveredOrders, status: 'Delivered Orders', icon: <FaCheckCircle className="empty-icon" /> };

  return (
    <div className="courier-page">
      <div className="page-header">
        <h2>Courier Service Portal</h2>
        <p>Manage delivery of shipped orders</p>
      </div>

      <div className="tabs-container">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          className="courier-tabs"
        >
          <Tab 
            label={
              <Badge badgeContent={shippedOrders.length} color="error" max={99}>
                <span className="tab-label"><FaTruck className="tab-icon" /> Pending Deliveries</span>
              </Badge>
            } 
            className="courier-tab"
          />
          <Tab 
            label={
              <Badge badgeContent={deliveredOrders.length} color="success" max={99}>
                <span className="tab-label"><FaCheckCircle className="tab-icon" /> Delivered Orders</span>
              </Badge>
            }
            className="courier-tab"
          />
        </Tabs>
      </div>

      <div className="courier-tools">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 0 ? 'pending' : 'delivered'} orders by ID, tracking, name, or address...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="refresh-button"
          onClick={() => activeTab === 0 ? fetchShippedOrders() : fetchDeliveredOrders()}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          {currentTabData.icon}
          <h3>No {currentTabData.status}</h3>
          <p>There are no {activeTab === 0 ? 'orders waiting to be delivered' : 'delivered orders'} at this time.</p>
        </div>
      ) : (
        <div className="order-table-container">
          <table className="order-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('order_item_id')}>
                  Order ID {getSortIcon('order_item_id')}
                </th>
                <th onClick={() => requestSort(activeTab === 0 ? 'shipping_date' : 'delivery_date')}>
                  {activeTab === 0 ? 'Shipped Date' : 'Delivered Date'} 
                  {getSortIcon(activeTab === 0 ? 'shipping_date' : 'delivery_date')}
                </th>
                <th onClick={() => requestSort('tracking_number')}>
                  Tracking# {getSortIcon('tracking_number')}
                </th>
                <th onClick={() => requestSort('recipient_name')}>
                  Recipient {getSortIcon('recipient_name')}
                </th>
                <th onClick={() => requestSort('district')}>
                  District {getSortIcon('district')}
                </th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.order_id}>
                  <td className="order-id-cell">
                    <span className="order-id">
                      <FaBox className="box-icon" /> #{order.order_item_id.toString().padStart(4, '0')}
                    </span>
                  </td>
                  <td>
                    {activeTab === 0 
                      ? formatDate(order.shipping_date)
                      : formatDate(order.delivery_date)
                    }
                  </td>
                  <td className="tracking-cell">
                    <div className="tracking-value">
                      {order.tracking_number || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="recipient-info">
                      <div className="recipient-name">{order.recipient_name}</div>
                      <div className="recipient-phone">{order.recipient_phone}</div>
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      <div className="district-value">{order.district}</div>
                      <div className="province-value">{order.province}</div>
                    </div>
                  </td>
                  <td className="address-cell">
                    <Tooltip title={formatFullAddress(order)} arrow placement="top">
                      <div className="address-preview">
                        <FaMapMarkerAlt className="address-icon" /> {formatShortAddress(order)}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="action-buttons">
                    <button 
                      className="action-btn view-btn" 
                      title="View Details"
                      onClick={() => handleViewDetails(order)}
                    >
                      <FaEye />
                    </button>
                    
                    {activeTab === 0 && (
                      <button 
                        className="action-btn deliver-btn" 
                        title="Confirm Delivery"
                        onClick={() => handleConfirmDelivery(order)}
                      >
                        <FaCheck />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Improved Order Details Modal with Better Content Containment */}
      {isDetailsModalOpen && orderDetails && (
        <div className="modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="details-modal modal-redesign" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{orderDetails.order_item_id.toString().padStart(4, '0')}</h3>
              <button className="close-btn" onClick={() => setIsDetailsModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detail-status">
                <div className={`status-badge ${activeTab === 0 ? 'shipped' : 'delivered'}`}>
                  {activeTab === 0 ? (
                    <><FaTruck className="status-icon" /> Shipped</>
                  ) : (
                    <><FaCheckCircle className="status-icon" /> Delivered</>
                  )}
                </div>
                
                <div className="tracking-info">
                  <span className="tracking-label">Tracking Number:</span>
                  <span className="tracking-value-text">{orderDetails.tracking_number || 'N/A'}</span>
                </div>
                
                <div className="date-info">
                  {activeTab === 0 ? (
                    <div className="shipping-date">
                      <FaCalendarAlt className="date-icon" />
                      <span>Shipped on: {formatDate(orderDetails.shipping_date)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="delivery-date">
                        <FaCalendarAlt className="date-icon" /> 
                        <span>Delivered on: {formatDate(orderDetails.delivery_date)}</span>
                      </div>
                      {orderDetails.employee_name && (
                        <div className="delivery-user">
                          <FaUser className="user-icon" />
                          <span>Processed by: {orderDetails.employee_name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="detail-sections">
                {/* Enhanced Delivery Address Section */}
                <div className="detail-section">
                  <h4><FaMapMarkerAlt /> Delivery Address</h4>
                  <div className="detail-content address-card">
                    <div className="address-header">
                      <div className="recipient-large">{orderDetails.recipient_name}</div>
                      <div className="phone-large">{orderDetails.recipient_phone}</div>
                    </div>
                    
                    <div className="address-components">
                      <div className="address-component">
                        <div className="component-icon"><FaRoad /></div>
                        <div className="component-details">
                          <div className="component-label">Street Address:</div>
                          <div className="component-value">{orderDetails.street_address}</div>
                        </div>
                      </div>
                      
                      {orderDetails.apt_suite_unit && (
                        <div className="address-component">
                          <div className="component-icon"><FaBuilding /></div>
                          <div className="component-details">
                            <div className="component-label">Apartment/Suite:</div>
                            <div className="component-value">{orderDetails.apt_suite_unit}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="address-component">
                        <div className="component-icon"><FaCity /></div>
                        <div className="component-details">
                          <div className="component-label">District:</div>
                          <div className="component-value">{orderDetails.district}</div>
                        </div>
                      </div>
                      
                      <div className="address-component">
                        <div className="component-icon"><FaMapMarkerAlt /></div>
                        <div className="component-details">
                          <div className="component-label">Province & Postal Code:</div>
                          <div className="component-value">{orderDetails.province}, {orderDetails.zip_code}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="full-address">
                      <div className="full-address-label">Complete Delivery Address:</div>
                      <div className="full-address-value">{formatFullAddress(orderDetails)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hidden Print Div */}
              <div id="print-delivery-slip" style={{ display: 'none' }}>
                <div className="delivery-slip">
                  <div className="slip-header">
                    <h2>DELIVERY SLIP</h2>
                    <div className="order-number">Order #{orderDetails.order_item_id.toString().padStart(4, '0')}</div>
                  </div>
                  
                  <div className="slip-tracking">
                    <div>Tracking Number: {orderDetails.tracking_number || 'N/A'}</div>
                    <div>Shipped Date: {formatDate(orderDetails.shipping_date)}</div>
                  </div>
                  
                  <div className="slip-address">
                    <h3>DELIVERY ADDRESS:</h3>
                    <div className="slip-recipient">{orderDetails.recipient_name}</div>
                    <div className="slip-phone">{orderDetails.recipient_phone}</div>
                    <div className="slip-street">{orderDetails.street_address}</div>
                    {orderDetails.apt_suite_unit && <div>{orderDetails.apt_suite_unit}</div>}
                    <div>{orderDetails.district}, {orderDetails.province}, {orderDetails.zip_code}</div>
                  </div>
                  
                  <div className="slip-confirmation">
                    <div className="signature-line">
                      <div>Recipient Signature:________________________</div>
                    </div>
                    <div className="date-line">
                      <div>Date:________________</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {activeTab === 0 && (
                <button 
                  className="print-btn" 
                  onClick={printDeliverySlip}
                >
                  <FaClipboardCheck /> Print Delivery Slip
                </button>
              )}
              
              <button 
                className="cancel-btn" 
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>
              
              {activeTab === 0 && (
                <button 
                  className="confirm-btn" 
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleConfirmDelivery(orderDetails);
                  }}
                >
                  <FaCheck /> Confirm Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Improved Delivery Confirmation Modal with Better Content Containment */}
      {isConfirmModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsConfirmModalOpen(false)}>
          <div className="confirm-modal modal-redesign" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delivery</h3>
              <button className="close-btn" onClick={() => setIsConfirmModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="confirm-icon">
                <FaCheckCircle />
              </div>
              
              <div className="confirm-message">
                <p>Are you sure you want to mark this order as delivered?</p>
                <p className="order-details">
                  Order #{selectedOrder.order_item_id.toString().padStart(4, '0')} to {selectedOrder.recipient_name}
                </p>
              </div>
              
              {/* Enhanced Address Display in Confirmation Modal */}
              <div className="confirm-address-card">
                <div className="confirm-address-header">
                  <FaMapMarkerAlt className="confirm-marker-icon" />
                  <span>Delivery Address</span>
                </div>
                <div className="confirm-address-content">
                  <p className="confirm-recipient">{selectedOrder.recipient_name} • {selectedOrder.recipient_phone}</p>
                  <p className="confirm-street">
                    <FaRoad className="mini-icon" /> {selectedOrder.street_address}
                    {selectedOrder.apt_suite_unit && `, ${selectedOrder.apt_suite_unit}`}
                  </p>
                  <p className="confirm-location">
                    <FaCity className="mini-icon" /> {selectedOrder.district}, {selectedOrder.province}, {selectedOrder.zip_code}
                  </p>
                </div>
              </div>
              
              <div className="delivery-confirmation-info">
                <div className="delivery-confirmation-header">
                  <FaCalendarAlt className="delivery-icon" />
                  <span>Delivery Information</span>
                </div>
                <div className="delivery-confirmation-content">
                  <p>
                    <span className="delivery-date-label">Delivery Date:</span> 
                    <span className="delivery-date-value">{new Date().toLocaleDateString()}</span>
                    <span className="auto-assigned">(automatically assigned)</span>
                  </p>
                </div>
              </div>
              
              <div className="confirmation-notice">
                <p>This action will update the order status from "Shipped" to "Delivered" and cannot be undone.</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={confirmDelivery}
              >
                <FaCheck /> Confirm Delivery
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
        <Alert 
          onClose={handleAlertClose} 
          severity={alert.severity} 
          sx={{ 
            width: '100%',
            ...(alert.severity === 'error' ? { fontWeight: 'bold' } : {}),
            ...(alert.severity === 'success' ? { backgroundColor: '#23b893', color: 'white' } : {})
          }}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SampleQuriaService;