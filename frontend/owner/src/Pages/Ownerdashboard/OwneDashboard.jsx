//OwneDashboard

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaShoppingCart, FaBoxOpen, FaUser, FaMoneyBillWave, 
  FaChartLine, FaExchangeAlt, FaExclamationTriangle,
  FaCalendarAlt, FaShippingFast, FaClock, FaCheck
} from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import withAuth from '../withAuth';
import './OwneDashboard.css';

const OwneDashboard = ({ userId }) => {
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    todaySales: 0,
    monthlySales: 0,
    lowStockProducts: 0,
    returnRequests: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [dateRange, setDateRange] = useState('week'); // 'week', 'month', 'year'
  const [error, setError] = useState(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('ownerToken');
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:8082/api/owner/dashboard-data?range=${dateRange}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          // Set all the state variables with data from response
          const { 
            stats, 
            recentOrders, 
            salesData, 
            productCategories, 
            orderStatus,
            recentReturns
          } = response.data;
          
          setStats(stats);
          setRecentOrders(recentOrders);
          setSalesData(salesData || []);
          setProductCategories(productCategories || []);
          setOrderStatus(orderStatus || []);
          setRecentReturns(recentReturns || []);
        } else {
          setError(response.data.message || "Failed to load dashboard data");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("An error occurred while loading dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  const formatCurrency = (value) => {
    return `Rs. ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'unpaid': return '#f39c12';
      case 'to be shipped': return '#3498db';
      case 'shipped': return '#2ecc71';
      case 'delivered': return '#27ae60';
      case 'failed': return '#e74c3c';
      case 'cancelled': return '#95a5a6';
      case 'processing': return '#9b59b6';
      case 'refunded': return '#34495e';
      case 'return requested': return '#e67e22';
      case 'pending': return '#f1c40f';
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'completed': return '#2ecc71';
      default: return '#bdc3c7';
    }
  };

  // Show loading screen while data is being fetched
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Show error screen if something went wrong
  if (error) {
    return (
      <div className="dashboard-error">
        <FaExclamationTriangle size={48} />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>Owner Dashboard</h1>
        <div className="date-filter">
          <button 
            className={dateRange === 'week' ? 'active' : ''}
            onClick={() => setDateRange('week')}
          >
            <FaCalendarAlt /> This Week
          </button>
          <button 
            className={dateRange === 'month' ? 'active' : ''}
            onClick={() => setDateRange('month')}
          >
            <FaCalendarAlt /> This Month
          </button>
          <button 
            className={dateRange === 'year' ? 'active' : ''}
            onClick={() => setDateRange('year')}
          >
            <FaCalendarAlt /> This Year
          </button>
        </div>
      </header>

      {/* Key Metrics Section */}
      <section className="metrics-section">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <FaMoneyBillWave />
          </div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <p className="metric-value">{formatCurrency(stats.totalRevenue)}</p>
            <p className="metric-label">Lifetime earnings</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orders">
            <FaShoppingCart />
          </div>
          <div className="metric-content">
            <h3>Pending Orders</h3>
            <p className="metric-value">{stats.pendingOrders}</p>
            <p className="metric-label">Need fulfillment</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon products">
            <FaBoxOpen />
          </div>
          <div className="metric-content">
            <h3>Total Products</h3>
            <p className="metric-value">{stats.totalProducts}</p>
            <p className="metric-label">{stats.lowStockProducts} low stock</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon customers">
            <FaUser />
          </div>
          <div className="metric-content">
            <h3>Customers</h3>
            <p className="metric-value">{stats.totalCustomers}</p>
            <p className="metric-label">Registered users</p>
          </div>
        </div>
      </section>

      {/* Sales Overview & Order Status Section */}
      <div className="dashboard-grid">
        <section className="chart-section sales-chart">
          <h2>Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={salesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${formatCurrency(value)}`, 'Revenue']} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3498db" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="orders" stroke="#e74c3c" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="chart-section order-status">
          <h2>Order Status</h2>
          {orderStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">
              <FaChartLine />
              <p>No order data available</p>
            </div>
          )}
        </section>
      </div>

      {/* Product Categories & Recent Returns Section */}
      <div className="dashboard-grid">
        <section className="chart-section category-chart">
          <h2>Product Categories</h2>
          {productCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                width={500}
                height={300}
                data={productCategories}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="products" fill="#8884d8" name="Products" />
                <Bar dataKey="sales" fill="#82ca9d" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">
              <FaBoxOpen />
              <p>No category data available</p>
            </div>
          )}
        </section>

        <section className="returns-section">
          <h2>Recent Return Requests</h2>
          {recentReturns.length === 0 ? (
            <div className="no-data-message">
              <FaExchangeAlt />
              <p>No recent return requests</p>
            </div>
          ) : (
            <div className="returns-list">
              {recentReturns.map(returnItem => (
                <div key={returnItem.return_id} className="return-item">
                  <div className="return-header">
                    <span className="return-id">Return #{returnItem.return_id}</span>
                    <span 
                      className="return-status"
                      style={{ backgroundColor: getStatusColor(returnItem.return_status) }}
                    >
                      {returnItem.return_status}
                    </span>
                  </div>
                  <div className="return-details">
                    <p><strong>Order:</strong> #{returnItem.order_id}</p>
                    <p><strong>Product:</strong> {returnItem.product_name}</p>
                    <p><strong>Reason:</strong> {returnItem.return_reason}</p>
                    <p><strong>Requested:</strong> {new Date(returnItem.created_at).toLocaleDateString()}</p>
                  </div>
                  <button className="view-details-btn">View Details</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Orders Section */}
      <section className="recent-orders-section">
        <h2>Recent Orders</h2>
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No recent orders</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.product_name}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.order_status) }}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td>
                      <button className="view-btn">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="view-all-link">
          <a href="/orders">View All Orders</a>
        </div>
      </section>

      {/* Inventory Alerts Section */}
      <section className="inventory-alerts-section">
        <h2>Inventory Alerts</h2>
        {stats.lowStockProducts === 0 ? (
          <div className="no-alerts">
            <FaCheck />
            <p>No inventory alerts at this time</p>
          </div>
        ) : (
          <div className="alert-card">
            <div className="alert-icon">
              <FaExclamationTriangle />
            </div>
            <div className="alert-content">
              <h3>{stats.lowStockProducts} Products Low In Stock</h3>
              <p>Some products need reordering</p>
              <button className="view-inventory-btn">View Inventory</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const AuthenticatedOwneDashboard = withAuth(OwneDashboard);
export default AuthenticatedOwneDashboard;
