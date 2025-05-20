/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import { useState, useEffect } from 'react';
import axios from 'axios';
import withAuth from '../withAuth'
import { 
  FaExchangeAlt, FaMoneyBillWave, FaTimes, FaCheck, 
  FaSearch, FaSyncAlt, FaInfoCircle, FaClipboard, 
  FaSortAmountDown, FaSortAmountUp, FaUser, FaBox,
  FaCalendarAlt, FaPhone, FaMapMarkerAlt, FaCreditCard
} from 'react-icons/fa';
import { Tabs, Tab, Tooltip, CircularProgress, Snackbar, Alert } from '@mui/material';
import './CancelOrders.css';

const CancelOrders = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [completedRefunds, setCompletedRefunds] = useState([]);
  const [refundStats, setRefundStats] = useState({
    pending_count: 0,
    completed_count: 0,
    pending_amount: 0,
    refunded_amount: 0
  });
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'order_date',
    direction: 'descending'
  });
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Tab content configuration
  const tabContent = [
    {
      id: 'pending',
      title: 'Pending Refunds',
      emptyMessage: 'No pending refunds at this time',
      data: pendingRefunds,
      showProcessButton: true
    },
    {
      id: 'completed',
      title: 'Completed Refunds',
      emptyMessage: 'No completed refunds found',
      data: completedRefunds,
      showProcessButton: false
    }
  ];

  // Fetch data on component mount and tab change
  useEffect(() => {
    fetchRefundData();
  }, [activeTab]);

  // Function to fetch refund data
  const fetchRefundData = async () => {
    setLoading(true);
    try {
      // Fetch refund statistics
      const statsResponse = await axios.get('http://localhost:8082/api/owner/refunds/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (statsResponse.data.success) {
        setRefundStats(statsResponse.data.stats);
      }

      // Fetch appropriate refund data based on active tab
      const endpoint = activeTab === 0 ? 'pending' : 'completed';
      const response = await axios.get(`http://localhost:8082/api/owner/refunds/${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        if (activeTab === 0) {
          setPendingRefunds(response.data.pendingRefunds);
        } else {
          setCompletedRefunds(response.data.completedRefunds);
        }
      }
    } catch (error) {
      console.error(`Error fetching refund data:`, error);
      setAlert({
        open: true,
        message: `Failed to load refund data: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to process refund
  const handleProcessRefund = async () => {
    if (!selectedOrder) return;
    
    setProcessingRefund(true);
    try {
      const response = await axios.post(
        `http://localhost:8082/api/owner/refunds/process/${selectedOrder.order_id}`,
        {
          refundNotes: 'Refund approved by admin',
          processedById: JSON.parse(localStorage.getItem('user'))?.id || null
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setAlert({
          open: true,
          message: `Successfully processed refund for order #${selectedOrder.order_item_id}`,
          severity: 'success'
        });
        
        // Update the local state to reflect the change
        setPendingRefunds(pendingRefunds.filter(order => order.order_id !== selectedOrder.order_id));
        
        // Refresh the data
        fetchRefundData();
        
        // Close modals
        setConfirmModalOpen(false);
        setDetailsModalOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      setAlert({
        open: true,
        message: `Failed to process refund: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  // Function to handle tab change
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };

  // Function to handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get current data with sorting and filtering applied
  const getCurrentData = () => {
    let filteredData = [...tabContent[activeTab].data];
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => 
        (item.order_item_id && item.order_item_id.toString().includes(searchTerm)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(searchLower)) ||
        (item.product_name && item.product_name.toLowerCase().includes(searchLower)) ||
        (item.recipient_name && item.recipient_name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredData;
  };

  // Function to get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSortAmountDown className="sort-icon" />;
    }
    
    return sortConfig.direction === 'ascending' 
      ? <FaSortAmountUp className="sort-icon active" /> 
      : <FaSortAmountDown className="sort-icon active" />;
  };

  // Event handlers for modals
  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const openConfirmModal = (order) => {
    setSelectedOrder(order);
    setConfirmModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setSelectedOrder(null);
  };

  const handleAlertClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setAlert({...alert, open: false});
  };

  return (
    <div className="refund-management-page">
      <div className="page-header">
        <h2><FaExchangeAlt /> Cancellation &amp; Refund Management</h2>
        <p>Process refunds and manage cancelled orders</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card pending">
          <div className="stat-icon"><FaMoneyBillWave /></div>
          <div className="stat-content">
            <div className="stat-title">Pending Refunds</div>
            <div className="stat-value">{refundStats.pending_count}</div>
            <div className="stat-amount">{formatCurrency(refundStats.pending_amount)}</div>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon"><FaCheck /></div>
          <div className="stat-content">
            <div className="stat-title">Completed Refunds</div>
            <div className="stat-value">{refundStats.completed_count}</div>
            <div className="stat-amount">{formatCurrency(refundStats.refunded_amount)}</div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          className="refund-tabs"
        >
          <Tab 
            label={`Pending Refunds (${refundStats.pending_count})`} 
            className="refund-tab"
          />
          <Tab 
            label={`Completed Refunds (${refundStats.completed_count})`}
            className="refund-tab"
          />
        </Tabs>
      </div>

      <div className="refund-tools">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 0 ? 'pending' : 'completed'} refunds by order ID, customer, or product...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="refresh-button"
          onClick={fetchRefundData}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <p>Loading refunds...</p>
        </div>
      ) : getCurrentData().length === 0 ? (
        <div className="empty-state">
          <FaMoneyBillWave className="empty-icon" />
          <h3>{tabContent[activeTab].emptyMessage}</h3>
          {activeTab === 0 ? (
            <p>There are no refunds waiting to be processed at this time.</p>
          ) : (
            <p>No refunded orders found in the system.</p>
          )}
        </div>
      ) : (
        <div className="refund-table-container">
          <table className="refund-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('order_item_id')}>
                  Order ID {getSortIcon('order_item_id')}
                </th>
                <th onClick={() => requestSort('order_date')}>
                  Order Date {getSortIcon('order_date')}
                </th>
                <th onClick={() => requestSort('customer_name')}>
                  Customer {getSortIcon('customer_name')}
                </th>
                <th onClick={() => requestSort('product_name')}>
                  Product {getSortIcon('product_name')}
                </th>
                <th onClick={() => requestSort('total_amount')}>
                  Amount {getSortIcon('total_amount')}
                </th>
                <th onClick={() => requestSort('payment_method_name')}>
                  Payment Method {getSortIcon('payment_method_name')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentData().map(order => (
                <tr key={order.order_id}>
                  <td className="order-id-cell">
                    <span className="order-id">
                      <FaBox className="box-icon" /> #{order.order_item_id.toString().padStart(4, '0')}
                    </span>
                  </td>
                  <td>
                    {formatDate(order.order_date)}
                  </td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{order.customer_name}</div>
                      <div className="customer-email">{order.customer_email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="product-info">
                      <div className="product-name">{order.product_name}</div>
                      <div className="product-variant">
                        {order.size && `Size: ${order.size}`}
                        {order.color && order.size && ' | '}
                        {order.color && `Color: ${order.color}`}
                      </div>
                    </div>
                  </td>
                  <td className="amount-cell">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td>
                    {order.payment_method_name || 'N/A'}
                  </td>
                  <td className="action-buttons">
                    <Tooltip title="View Details" arrow>
                      <button 
                        className="action-btn view-btn" 
                        onClick={() => openDetailsModal(order)}
                      >
                        <FaInfoCircle />
                      </button>
                    </Tooltip>
                    
                    {activeTab === 0 && (
                      <Tooltip title="Process Refund" arrow>
                        <button 
                          className="action-btn refund-btn" 
                          onClick={() => openConfirmModal(order)}
                        >
                          <FaCheck />
                        </button>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {detailsModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.order_item_id.toString().padStart(4, '0')} Details</h3>
              <button className="close-btn" onClick={closeDetailsModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detail-section">
                <h4><FaUser /> Customer Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Name</div>
                    <div className="detail-value">{selectedOrder.customer_name}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Email</div>
                    <div className="detail-value">{selectedOrder.customer_email}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Phone</div>
                    <div className="detail-value">{selectedOrder.customer_phone}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Order Date</div>
                    <div className="detail-value">{formatDate(selectedOrder.order_date)}</div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4><FaBox /> Product Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Product Name</div>
                    <div className="detail-value">{selectedOrder.product_name}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Product ID</div>
                    <div className="detail-value">{selectedOrder.ProductID}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Size</div>
                    <div className="detail-value">{selectedOrder.size || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Color</div>
                    <div className="detail-value">{selectedOrder.color || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4><FaMapMarkerAlt /> Delivery Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Recipient</div>
                    <div className="detail-value">{selectedOrder.recipient_name}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Contact</div>
                    <div className="detail-value">{selectedOrder.recipient_phone}</div>
                  </div>
                  <div className="detail-item full-width">
                    <div className="detail-label">Address</div>
                    <div className="detail-value">
                      {selectedOrder.street_address}, {selectedOrder.district}, {selectedOrder.province}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4><FaCreditCard /> Payment Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Payment Method</div>
                    <div className="detail-value">{selectedOrder.payment_method_name || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Status</div>
                    <div className="detail-value">{selectedOrder.payment_status || 'N/A'}</div>
                  </div>
                  {selectedOrder.transaction_reference && (
                    <div className="detail-item">
                      <div className="detail-label">Transaction Reference</div>
                      <div className="detail-value">{selectedOrder.transaction_reference}</div>
                    </div>
                  )}
                  {selectedOrder.payment_date && (
                    <div className="detail-item">
                      <div className="detail-label">Payment Date</div>
                      <div className="detail-value">{formatDate(selectedOrder.payment_date)}</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="detail-section">
                <h4><FaMoneyBillWave /> Amount Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Subtotal</div>
                    <div className="detail-value">{formatCurrency(selectedOrder.total_price)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Delivery Fee</div>
                    <div className="detail-value">{formatCurrency(selectedOrder.delivery_fee)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Total Amount</div>
                    <div className="detail-value total-amount">{formatCurrency(selectedOrder.total_amount)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={closeDetailsModal}
              >
                Close
              </button>
              
              {activeTab === 0 && (
                <button 
                  className="refund-btn" 
                  onClick={() => {
                    closeDetailsModal();
                    openConfirmModal(selectedOrder);
                  }}
                >
                  <FaMoneyBillWave /> Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Refund Modal */}
      {confirmModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Refund</h3>
              <button className="close-btn" onClick={closeConfirmModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="confirm-icon">
                <FaMoneyBillWave />
              </div>
              
              <div className="confirm-message">
                <p>Are you sure you want to process this refund?</p>
                <p className="order-details">
                  Order #{selectedOrder.order_item_id.toString().padStart(4, '0')} - {selectedOrder.product_name}
                </p>
                <p className="customer-details">
                  Customer: {selectedOrder.customer_name}
                </p>
                <p className="amount-details">
                  Refund Amount: <span className="amount-value">{formatCurrency(selectedOrder.total_amount)}</span>
                </p>
              </div>
              
              <div className="confirmation-notice">
                <p>This action will update the order status from "Processing" to "Refunded" and cannot be undone.</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={closeConfirmModal}
                disabled={processingRefund}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleProcessRefund}
                disabled={processingRefund}
              >
                {processingRefund ? (
                  <>
                    <CircularProgress size={20} color="inherit" /> Processing...
                  </>
                ) : (
                  <>
                    <FaCheck /> Confirm Refund
                  </>
                )}
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
            fontWeight: alert.severity === 'error' ? 'bold' : 'normal'
          }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

const AuthenticatedCancelOrders = withAuth(CancelOrders);
export default AuthenticatedCancelOrders;
