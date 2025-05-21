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
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register ArcElement for pie charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import withAuth from '../withAuth';
import './OwneDashboard.css';

const OwneDashboard = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerChartType, setCustomerChartType] = useState('daily');
  const [expenseChartType, setExpenseChartType] = useState('monthly');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    axios.get(`http://localhost:8082/api/owner/dashboard-stats?timeRange=${timeRange}`)
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [timeRange]); // Re-fetch when time range changes

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Failed to load dashboard.</div>;

  // Prepare expenses chart data
  let expenseLabels = [];
  let expenseData = [];
  if (expenseChartType === 'daily') {
    expenseLabels = stats.expensesByDay.map(e => e.date);
    expenseData = stats.expensesByDay.map(e => e.total);
  } else if (expenseChartType === 'weekly') {
    expenseLabels = stats.expensesByWeek.map(e => `W${e.week} ${e.year}`);
    expenseData = stats.expensesByWeek.map(e => e.total);
  } else if (expenseChartType === 'monthly') {
    expenseLabels = stats.expensesByMonth.map(e => e.month);
    expenseData = stats.expensesByMonth.map(e => e.total);
  }

  const chartData = {
    labels: expenseLabels,
    datasets: [
      {
        label: 'Expenses (LKR)',
        data: expenseData,
        backgroundColor: '#4e73df',
      },
    ],
  };

  // Prepare customer line chart data
  let customerLabels = [];
  let customerData = [];
  if (customerChartType === 'daily') {
    customerLabels = stats.customersByDay.map(e => e.date);
    customerData = stats.customersByDay.map(e => e.count);
  } else if (customerChartType === 'weekly') {
    customerLabels = stats.customersByWeek.map(e => `W${e.week} ${e.year}`);
    customerData = stats.customersByWeek.map(e => e.count);
  } else if (customerChartType === 'monthly') {
    customerLabels = stats.customersByMonth.map(e => e.month);
    customerData = stats.customersByMonth.map(e => e.count);
  }
  const customerLineData = {
    labels: customerLabels,
    datasets: [
      {
        label: 'New Customers',
        data: customerData,
        fill: false,
        borderColor: '#36a2eb',
        backgroundColor: '#36a2eb',
        tension: 0.3,
      },
    ],
  };

  // Customer chart options with better label formatting
  const customerChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: '#f0f0f0'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0 // Ensure whole numbers only for customer count
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function(context) {
            return `New Customers: ${context.raw}`;
          }
        }
      }
    }
  };

  // Convert to vertical bar chart for color sales (not horizontal)
  const colorBarData = {
    labels: stats.salesByColor.map(item => item.ColorValue),
    datasets: [{
      label: 'Quantity Sold',
      data: stats.salesByColor.map(item => item.total_quantity),
      backgroundColor: stats.salesByColor.map(item => {
        const colorMap = {
          'Black': '#000000',
          'White': '#FFFFFF',
          'Red': '#FF0000',
          'Blue': '#0000FF',
          'Green': '#008000',
          'Yellow': '#FFFF00',
          'Pink': '#FFC0CB',
          'Purple': '#800080',
          'Orange': '#FFA500',
          'Brown': '#A52A2A',
          'Grey': '#808080',
          'Navy': '#000080',
          'Cyan': '#00FFFF',
          'Magenta': '#FF00FF',
          'Gold': '#FFD700',
          'Silver': '#C0C0C0'
        };
        return colorMap[item.ColorValue] || '#000000';
      }),
      borderColor: '#333',
      borderWidth: 1
    }]
  };

  // Vertical bar chart options
  const colorBarOptions = {
    indexAxis: 'x', // Makes the bar chart vertical
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Quantity: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            weight: 'bold'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0'
        },
        ticks: {
          precision: 0 // Ensure whole numbers for quantity
        },
        title: {
          display: true,
          text: 'Quantity Sold',
          font: {
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Owner Dashboard</h1>
        <div className="time-range-selector">
          <span>Time Range: </span>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>
      
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <FaChartLine size={32} color="#48bb78" />
          <div>
            <div>Company Profit</div>
            <strong>LKR {parseFloat(stats.profit).toLocaleString()}</strong>
          </div>
        </div>  
        <div className="dashboard-card">
          <FaMoneyBillWave size={32} color="#e53e3e" />
          <div>
            <div>Total Expenses</div>
            <strong>LKR {parseFloat(stats.expenses.totalCost).toLocaleString()}</strong>
          </div>
        </div>
        <div className="dashboard-card">
          <FaUser size={32} color="#4299e1" />
          <div>
            <div>Total Customers</div>
            <strong>{stats.customers}</strong>
          </div>
        </div>
        <div className="dashboard-card">
          <FaUser size={32} color="#805ad5" />
          <div>
            <div>Total Employees</div>
            <strong>{stats.employees}</strong>
          </div>
        </div>
      </div>
      
      {/* New Top Products Card Section */}
      <div className="top-products-section">
        <h3 className="section-title">
          <FaBoxOpen className="section-icon" />
          Top Selling Products
        </h3>
        <div className="top-products-grid">
          {stats.topProducts && stats.topProducts.map((product, index) => (
            <div className={`top-product-card ${index === 0 ? 'top-seller' : ''}`} key={product.ProductID}>
              <div className="product-rank">{index + 1}</div>
              <div className="product-details">
                <div className="product-name">{product.ProductName}</div>
                <div className="product-quantity">
                  <span>{product.total_quantity}</span> units sold
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="dashboard-charts-container">
        <div className="chart-row">
          <div className="dashboard-chart">
            <h3>
              Expenses by Period&nbsp;
              <select value={expenseChartType} onChange={e => setExpenseChartType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </h3>
            <div className="chart-wrapper">
              <Bar data={chartData} options={{responsive: true, maintainAspectRatio: false}} />
            </div>
          </div>
          
          <div className="dashboard-chart">
            <h3>
              New Customers&nbsp;
              <select value={customerChartType} onChange={e => setCustomerChartType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </h3>
            <div className="chart-wrapper">
              <Line 
                data={customerLineData} 
                options={customerChartOptions} 
              />
            </div>
          </div>
        </div>
        
        <div className="dashboard-chart wide-chart">
          <h3>Product Quantity by Color</h3>
          <div className="chart-wrapper">
            <Bar data={colorBarData} options={colorBarOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthenticatedOwneDashboard = withAuth(OwneDashboard);
export default AuthenticatedOwneDashboard;
