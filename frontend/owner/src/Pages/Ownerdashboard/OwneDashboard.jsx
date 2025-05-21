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
import { Bar, Line, Pie } from 'react-chartjs-2';
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
  const [expenseChartType, setExpenseChartType] = useState('monthly'); // Add this line

  useEffect(() => {
    axios.get('http://localhost:8082/api/owner/dashboard-stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  // Prepare pie chart data for color sales
  const colorPieData = {
    labels: stats.salesByColor.map(item => item.ColorValue),
    datasets: [{
      data: stats.salesByColor.map(item => item.total_sales),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#FF6384',
        '#36A2EB'
      ],
      borderWidth: 1
    }]
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Sales by Color',
        font: {
          size: 16
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="owner-dashboard">
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <FaChartLine size={32} />
          <div>
            <div>Company Profit</div>
            <strong>LKR {stats.profit}</strong>
          </div>
        </div>  
        <div className="dashboard-card">
          <FaMoneyBillWave size={32} />
          <div>
            <div>Total Expenses</div>
            <strong>LKR {stats.expenses.totalCost}</strong>
          </div>
        </div>
        <div className="dashboard-card">
          <FaUser size={32} />
          <div>
            <div>Total Customers</div>
            <strong>{stats.customers}</strong>
          </div>
        </div>
        <div className="dashboard-card">
          <FaUser size={32} />
          <div>
            <div>Total Employees</div>
            <strong>{stats.employees}</strong>
          </div>
        </div>
      </div>
      <div className="dashboard-chart">
        <h3>
          Expenses by Period&nbsp;
          <select value={expenseChartType} onChange={e => setExpenseChartType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </h3>
        <Bar data={chartData} />
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
        <Line data={customerLineData} />
      </div>
      <div className="dashboard-chart">
        <h3>Sales Distribution by Color</h3>
        <div style={{ height: '400px' }}>
          <Pie data={colorPieData} options={pieOptions} />
        </div>
      </div>
    </div>
  );
};

const AuthenticatedOwneDashboard = withAuth(OwneDashboard);
export default AuthenticatedOwneDashboard;
