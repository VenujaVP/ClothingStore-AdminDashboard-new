// pages/Expenses/ExpensesList.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState, useEffect } from 'react';
import withAuth from '../../Pages/withAuth';
import './ExpensesList.css';
import {
  FaMoneyBillWave, FaSearch, FaEdit, FaTrash, FaSort, FaFilter, FaEye,
  FaTimes, FaExclamationTriangle, FaCheck, FaCalendarAlt, FaPlusCircle,
  FaInfoCircle, FaCoins, FaChartLine, FaRetweet, FaFile, FaFileImage, FaTag,
  FaFilePdf, FaFileAlt, FaDownload, FaExternalLinkAlt, FaPaperclip, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import axios from 'axios';
import {
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Divider, Typography, Grid, Box, Chip, CircularProgress, IconButton
} from '@mui/material';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

// Validation schema for expense form
const expenseValidationSchema = Yup.object({
  date: Yup.date()
    .required('Date is required'),
  expense_custom_id: Yup.string()
    .required('Expense ID is required')
    .min(3, 'Expense ID must be at least 3 characters')
    .max(50, 'Expense ID cannot exceed 50 characters'),
  expenses_name: Yup.string()
    .required('Expense name is required')
    .min(3, 'Expense name must be at least 3 characters')
    .max(255, 'Expense name cannot exceed 255 characters'),
  cost: Yup.number()
    .required('Cost is required')
    .positive('Cost must be a positive number')
    .typeError('Cost must be a number'),
  description: Yup.string()
    .nullable()
});

const ExpensesList = () => {
  const navigate = useNavigate();
  
  // State for expenses data
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });
  
  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, expense: null, files: [], loadingFiles: false });
  const [singleFilePreviewDialog, setSingleFilePreviewDialog] = useState({ 
    open: false, 
    file: null,
    isLoading: false,
    error: null 
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  
  // Alerts
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    currentMonth: 0,
    today: 0
  });

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Calculate statistics whenever expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      calculateStats();
    }
  }, [expenses]);

  // Calculate various expense statistics
  const calculateStats = () => {
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.cost), 0);
    
    // Get current month expenses
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const monthTotal = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.cost), 0);
    
    // Get today's expenses
    const todayStr = today.toISOString().split('T')[0];
    const todayExpenses = expenses.filter(expense => expense.date === todayStr);
    const todayTotal = todayExpenses.reduce((sum, expense) => sum + parseFloat(expense.cost), 0);
    
    setStats({
      total: total.toFixed(2),
      currentMonth: monthTotal.toFixed(2),
      today: todayTotal.toFixed(2)
    });
  };

  // Function to fetch expenses from API
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8082/api/owner/expenses');
      if (response.data && response.data.Status === 'success') {
        setExpenses(response.data.expenses);
      } else {
        throw new Error(response.data.message || 'Failed to fetch expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Failed to load expense data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearchQuery('');
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Special handling for numbers vs strings
      if (sortConfig.key === 'cost') {
        return sortConfig.direction === 'asc' 
          ? parseFloat(aValue) - parseFloat(bValue)
          : parseFloat(bValue) - parseFloat(aValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  // Filter expenses based on search query and filters
  const filteredExpenses = sortedExpenses.filter((expense) => {
    // Search filter
    const matchesSearch = 
      (expense.expense_custom_id && expense.expense_custom_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      expense.expenses_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (expense.description && expense.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.startDate && filters.endDate) {
      matchesDateRange = expense.date >= filters.startDate && expense.date <= filters.endDate;
    } else if (filters.startDate) {
      matchesDateRange = expense.date >= filters.startDate;
    } else if (filters.endDate) {
      matchesDateRange = expense.date <= filters.endDate;
    }
    
    // Amount range filter
    let matchesAmountRange = true;
    const cost = parseFloat(expense.cost);
    if (filters.minAmount && filters.maxAmount) {
      matchesAmountRange = cost >= parseFloat(filters.minAmount) && cost <= parseFloat(filters.maxAmount);
    } else if (filters.minAmount) {
      matchesAmountRange = cost >= parseFloat(filters.minAmount);
    } else if (filters.maxAmount) {
      matchesAmountRange = cost <= parseFloat(filters.maxAmount);
    }
    
    return matchesSearch && matchesDateRange && matchesAmountRange;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Get file icon based on content type
  const getFileIcon = (contentType) => {
    if (contentType.startsWith('image/')) {
      return <FaFileImage className="file-type-icon image" />;
    } else if (contentType === 'application/pdf') {
      return <FaFilePdf className="file-type-icon pdf" />;
    } else {
      return <FaFileAlt className="file-type-icon document" />;
    }
  };

  // View expense details
  const handleViewExpense = async (expense) => {
    setViewDialog({ 
      open: true, 
      expense, 
      files: [], 
      loadingFiles: true 
    });
    
    try {
      // Fetch expense details including files
      const response = await axios.get(`http://localhost:8082/api/owner/expenses/${expense.expenses_id}`);
      
      if (response.data && response.data.Status === 'success') {
        setViewDialog({
          open: true,
          expense: response.data.expense,
          files: response.data.expense.files || [],
          loadingFiles: false
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch expense details');
      }
    } catch (error) {
      console.error('Error fetching expense details:', error);
      setViewDialog(prev => ({
        ...prev,
        loadingFiles: false
      }));
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Failed to load expense details',
        severity: 'error'
      });
    }
  };

  // Close view dialog
  const handleCloseViewDialog = () => {
    setViewDialog({ open: false, expense: null, files: [], loadingFiles: false });
  };

  // View file
  const handleViewFile = async (expenseIdOrFile, fileIndex, e) => {
    // If event exists, stop propagation
    if (e) {
      e.stopPropagation();
    }
    
    // If first argument is a file object (from viewDialog)
    if (typeof expenseIdOrFile === 'object' && expenseIdOrFile !== null) {
      const file = expenseIdOrFile;
      const expenseId = viewDialog.expense?.expense_custom_id || viewDialog.expense?.expenses_id;
      
      // Set the file URL properly
      const fullUrl = file.file_url?.startsWith('http') 
        ? file.file_url 
        : `http://localhost:8082/api/owner/expenses/${expenseId}/files/${file.index || 0}`;
      
      setSingleFilePreviewDialog({
        open: true,
        file: {
          ...file,
          file_url: fullUrl
        },
        fileIndex: file.index || 0,
        allFiles: viewDialog.files,
        totalFiles: viewDialog.files.length,
        isLoading: false,
        error: null,
        expenseId: expenseId
      });
      return;
    }
    
    // Regular flow - using expense ID and file index
    const expenseId = expenseIdOrFile;
    
    setSingleFilePreviewDialog({
      open: true,
      file: null,
      isLoading: true,
      error: null,
      expenseId: expenseId
    });
    
    try {
      // First fetch files for this expense
      const response = await axios.get(`http://localhost:8082/api/owner/expenses/${expenseId}/files`);
      
      if (!response.data || response.data.Status !== 'success' || !response.data.files || response.data.files.length === 0) {
        throw new Error(response.data?.message || 'No files found for this expense');
      }
      
      // Get the specific file or first file if index not provided
      const fileToShow = fileIndex !== undefined ? 
        response.data.files[fileIndex] : 
        response.data.files[0];
      
      if (!fileToShow) {
        throw new Error('File not found');
      }
      
      // Make sure we have a complete URL
      const fullUrl = fileToShow.file_url.startsWith('http') 
        ? fileToShow.file_url 
        : `http://localhost:8082${fileToShow.file_url}`;
      
      setSingleFilePreviewDialog({
        open: true,
        file: {
          ...fileToShow,
          file_url: fullUrl
        },
        fileIndex: fileIndex || 0,
        allFiles: response.data.files,
        totalFiles: response.data.files.length,
        isLoading: false,
        error: null,
        expenseId: expenseId
      });
    } catch (error) {
      console.error('Error fetching file:', error);
      setSingleFilePreviewDialog({
        open: true,
        file: null,
        isLoading: false,
        error: error.message || 'Failed to load file',
        expenseId: expenseId
      });
    }
  };

  // Navigate to add expense page
  const handleAddExpense = () => {
    navigate('/expenses/add');
  };

  // Fix the edit expense handler
  const handleEditExpense = (expense) => {
    // Make sure we have a valid expense object
    if (!expense || (!expense.expenses_id && !expense.expense_custom_id)) {
      setAlert({
        open: true,
        message: 'Cannot edit: Invalid expense data',
        severity: 'error'
      });
      return;
    }
    
    // Use the custom ID if available, otherwise fall back to the numeric ID
    const expenseId = expense.expense_custom_id || expense.expenses_id;
    
    // Store the expense data in sessionStorage to avoid extra API call
    sessionStorage.setItem('editExpense', JSON.stringify(expense));
    
    // Navigate to edit page
    navigate(`/expenses/edit/${expenseId}`);
  };

  // Open delete confirmation dialog
  const handleConfirmDelete = (id) => {
    setConfirmDialog({ open: true, id });
  };

  // Close delete confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, id: null });
  };

  // Delete expense
  const handleDeleteExpense = async () => {
    if (!confirmDialog.id) return;
    
    try {
      const response = await axios.delete(`http://localhost:8082/api/owner/expenses/${confirmDialog.id}`);
      
      if (response.data && response.data.Status === 'success') {
        setAlert({
          open: true,
          message: 'Expense deleted successfully',
          severity: 'success'
        });
        fetchExpenses(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Error deleting expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Error deleting expense',
        severity: 'error'
      });
    } finally {
      setConfirmDialog({ open: false, id: null });
    }
  };

  // Improved download function
  const handleDownloadFile = (file) => {
    try {
      // Create a complete URL if needed
      const fullUrl = file.file_url.startsWith('http') 
        ? file.file_url 
        : `http://localhost:8082${file.file_url}`;
      
      // Use fetch to get the file as a blob
      fetch(fullUrl)
        .then(response => response.blob())
        .then(blob => {
          // Create a blob URL for the file
          const blobUrl = URL.createObjectURL(blob);
          
          // Create a temporary link for downloading
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = file.file_name; // This forces download instead of navigation
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 100);
          
          setAlert({
            open: true,
            message: 'File downloaded successfully',
            severity: 'success'
          });
        })
        .catch(error => {
          console.error('Download error:', error);
          throw error;
        });
    } catch (error) {
      console.error('Error downloading file:', error);
      setAlert({
        open: true,
        message: 'Failed to download file',
        severity: 'error'
      });
    }
  };

  return (
    <div className="expenses-list-container">
      <div className="expenses-list-card">
        <div className="expenses-header">
          <div className="expenses-title">
            <FaMoneyBillWave className="title-icon" />
            <h2>Expense Management</h2>
          </div>
          
          <div className="expenses-actions">
            <button className="add-expense-btn" onClick={handleAddExpense}>
              <FaPlusCircle /> Add New Expense
            </button>
          </div>
          
          <div className="expenses-stats">
            <div className="stat-box total">
              <span className="stat-value">{formatCurrency(stats.total)}</span>
              <span className="stat-label">Total Expenses</span>
            </div>
            <div className="stat-box month">
              <span className="stat-value">{formatCurrency(stats.currentMonth)}</span>
              <span className="stat-label">This Month</span>
            </div>
            <div className="stat-box today">
              <span className="stat-value">{formatCurrency(stats.today)}</span>
              <span className="stat-label">Today</span>
            </div>
          </div>
        </div>
        
        <div className="search-filter-container">
          <div className="search-bar">
            <div className="input-group">
              <FaSearch className="input-icon" />
              <input
                type="text"
                placeholder="Search expenses by ID, name or description..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <div className="filter-section">
            <h3>
              <FaFilter /> Filter Expenses
            </h3>
            <div className="filter-options">
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-range">
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    placeholder="From"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    placeholder="To"
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>Amount Range</label>
                <div className="date-range">
                  <input
                    type="number"
                    name="minAmount"
                    value={filters.minAmount}
                    onChange={handleFilterChange}
                    placeholder="Min Amount"
                    min="0"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="maxAmount"
                    value={filters.maxAmount}
                    onChange={handleFilterChange}
                    placeholder="Max Amount"
                    min="0"
                  />
                </div>
              </div>
              
              <button className="clear-filters-btn" onClick={handleClearFilters}>
                <FaRetweet /> Clear Filters
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading expenses...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('expense_custom_id')}>
                    ID 
                    <span className="sort-indicator">
                      {sortConfig.key === 'expense_custom_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('date')}>
                    Date
                    <span className="sort-indicator">
                      {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('expenses_name')}>
                    Expense Name
                    <span className="sort-indicator">
                      {sortConfig.key === 'expenses_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('cost')}>
                    Amount
                    <span className="sort-indicator">
                      {sortConfig.key === 'cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th>Files</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.expenses_id}>
                    <td>{expense.expense_custom_id || expense.expenses_id}</td>
                    <td className="date-cell">{formatDate(expense.date)}</td>
                    <td>{expense.expenses_name}</td>
                    <td className="cost-cell">{formatCurrency(expense.cost)}</td>
                    <td className="files-cell">
                      {expense.fileCount > 0 ? (
                        <span 
                          className="file-count" 
                          onClick={(e) => handleViewFile(expense.expense_custom_id || expense.expenses_id, 0, e)}
                        >
                          <FaPaperclip /> {expense.fileCount} {expense.fileCount === 1 ? 'file' : 'files'}
                        </span>
                      ) : (
                        <span className="no-files">No files</span>
                      )}
                    </td>
                    <td className="description-cell">
                      {expense.description ? (
                        expense.description.length > 50 ? (
                          <span 
                            className="long-description" 
                            title={expense.description}
                            onClick={() => handleViewExpense(expense)}
                          >
                            {expense.description.substring(0, 50)}...
                          </span>
                        ) : (
                          expense.description
                        )
                      ) : (
                        <span className="text-muted">No description</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view-btn" onClick={() => handleViewExpense(expense)} title="View details">
                          <FaEye />
                        </button>
                        <button className="action-btn edit-btn" onClick={() => handleEditExpense(expense)} title="Edit expense">
                          <FaEdit />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleConfirmDelete(expense.expenses_id)} title="Delete expense">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && filteredExpenses.length === 0 && (
          <div className="no-results">
            <FaExclamationTriangle className="no-results-icon" />
            <p>No expenses match your search criteria</p>
            <button 
              className="reset-filters-btn" 
              onClick={handleClearFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
        
        {/* Summary table for filtered expenses */}
        {!loading && filteredExpenses.length > 0 && (
          <div className="summary-table">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th colSpan="2">Expense Summary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Number of Expenses:</td>
                  <td>{filteredExpenses.length}</td>
                </tr>
                <tr>
                  <td>Total Amount:</td>
                  <td>{formatCurrency(filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.cost), 0))}</td>
                </tr>
                <tr>
                  <td>Average Amount:</td>
                  <td>{formatCurrency(filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.cost), 0) / filteredExpenses.length)}</td>
                </tr>
                <tr>
                  <td>Highest Expense:</td>
                  <td>{formatCurrency(Math.max(...filteredExpenses.map(expense => parseFloat(expense.cost))))}</td>
                </tr>
                <tr>
                  <td>Lowest Expense:</td>
                  <td>{formatCurrency(Math.min(...filteredExpenses.map(expense => parseFloat(expense.cost))))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* View Expense Dialog */}
      <Dialog 
        open={viewDialog.open} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {viewDialog.expense && (
          <>
            <DialogTitle className="dialog-title">
              <div className="dialog-title-content">
                <FaInfoCircle className="dialog-title-icon" />
                Expense Details
              </div>
              <Button onClick={handleCloseViewDialog}>
                <FaTimes />
              </Button>
            </DialogTitle>
            <DialogContent>
              {viewDialog.expense && (
                <div className="expense-details-container">
                  {/* Row 1: ID and Amount */}
                  <div className="detail-row">
                    <div className="detail-card">
                      <div className="detail-card-label">ID</div>
                      <div className="detail-card-value primary">
                        {viewDialog.expense.expense_custom_id || viewDialog.expense.expenses_id}
                      </div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-card-label">Amount</div>
                      <div className="detail-card-value amount">
                        {formatCurrency(viewDialog.expense.cost)}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Date and Expense Name */}
                  <div className="detail-row">
                    <div className="detail-card">
                      <div className="detail-card-label">Date</div>
                      <div className="detail-card-value">
                        <FaCalendarAlt className="detail-icon" />
                        {formatDate(viewDialog.expense.date)}
                      </div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-card-label">Expense Name</div>
                      <div className="detail-card-value">
                        <FaTag className="detail-icon" />
                        {viewDialog.expense.expenses_name}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div className="detail-section">
                    <div className="detail-section-header">
                      <FaInfoCircle className="section-icon" />
                      <span>Description</span>
                    </div>
                    <div className="detail-section-content">
                      {viewDialog.expense.description ? (
                        <p className="description-text">{viewDialog.expense.description}</p>
                      ) : (
                        <p className="no-content">No description provided</p>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Attachments */}
                  <div className="detail-section">
                    <div className="detail-section-header">
                      <FaPaperclip className="section-icon" />
                      <span>Attachments</span>
                    </div>
                    <div className="detail-section-content">
                      {viewDialog.loadingFiles ? (
                        <div className="files-loading">
                          <CircularProgress size={24} />
                          <span>Loading attachments...</span>
                        </div>
                      ) : viewDialog.files && viewDialog.files.length > 0 ? (
                        <div className="file-grid">
                          {viewDialog.files.map((file, index) => (
                            <div key={index} className="file-item">
                              <div className="file-icon">
                                {getFileIcon(file.content_type)}
                              </div>
                              <div className="file-info">
                                <div className="file-name" title={file.file_name}>
                                  {file.file_name}
                                </div>
                                <div className="file-meta">
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                              <div className="file-actions">
                                <button 
                                  className="file-action-btn view-btn" 
                                  onClick={() => handleViewFile(file)}
                                  title="View File"
                                >
                                  <FaEye />
                                </button>
                                <button 
                                  className="file-action-btn download-btn" 
                                  onClick={() => handleDownloadFile(file)}
                                  title="Download File"
                                >
                                  <FaDownload />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-files">
                          <FaExclamationTriangle />
                          <span>No files attached to this expense</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
      
      {/* Improved File Preview Dialog */}
      <Dialog
        open={singleFilePreviewDialog.open}
        onClose={() => setSingleFilePreviewDialog({ open: false, file: null, isLoading: false, error: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          className: "file-preview-dialog"
        }}
      >
        <DialogTitle className="file-preview-title">
          <div className="file-title-content">
            {singleFilePreviewDialog.file && (
              <>
                {singleFilePreviewDialog.file.content_type.startsWith('image/') ? (
                  <FaFileImage className="file-title-icon image" />
                ) : singleFilePreviewDialog.file.content_type === 'application/pdf' ? (
                  <FaFilePdf className="file-title-icon pdf" />
                ) : (
                  <FaFile className="file-title-icon" />
                )}
                <span className="file-name-text">{singleFilePreviewDialog.file.file_name}</span>
              </>
            )}
            {!singleFilePreviewDialog.file && (
              <>
                <FaFileAlt className="file-title-icon" />
                <span>File Preview</span>
              </>
            )}
          </div>
          <IconButton 
            className="file-close-button"
            size="small"
            edge="end"
            onClick={() => setSingleFilePreviewDialog({ open: false, file: null, isLoading: false, error: null })}
          >
            <FaTimes />
          </IconButton>
        </DialogTitle>
        
        <DialogContent className="file-preview-content">
          {singleFilePreviewDialog.isLoading ? (
            <div className="file-loading">
              <CircularProgress size={48} thickness={4} />
              <span>Loading file...</span>
            </div>
          ) : singleFilePreviewDialog.error ? (
            <div className="file-preview-error">
              <FaExclamationTriangle />
              <p>{singleFilePreviewDialog.error}</p>
            </div>
          ) : singleFilePreviewDialog.file ? (
            <div className="file-preview-container">
              {singleFilePreviewDialog.file.content_type.startsWith('image/') ? (
                <div className="image-preview">
                  <img 
                    src={singleFilePreviewDialog.file.file_url} 
                    alt={singleFilePreviewDialog.file.file_name} 
                    onError={() => {
                      setSingleFilePreviewDialog(prev => ({
                        ...prev,
                        error: 'Failed to load image. Please try downloading instead.'
                      }));
                    }}
                  />
                </div>
              ) : singleFilePreviewDialog.file.content_type === 'application/pdf' ? (
                <div className="pdf-preview">
                  <iframe 
                    src={singleFilePreviewDialog.file.file_url} 
                    title={singleFilePreviewDialog.file.file_name}
                    onError={() => {
                      setSingleFilePreviewDialog(prev => ({
                        ...prev,
                        error: 'Failed to load PDF. Please try downloading instead.'
                      }));
                    }}
                  ></iframe>
                </div>
              ) : (
                <div className="generic-file-preview">
                  <div className="generic-file-icon">
                    <FaFileAlt />
                  </div>
                  <p className="generic-file-message">
                    This file type cannot be previewed directly.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-file-selected">
              <p>No file selected</p>
            </div>
          )}
        </DialogContent>
        
        <DialogActions className="file-preview-actions">
          {/* File pagination if there are multiple files */}
          {singleFilePreviewDialog.totalFiles > 1 && (
            <div className="file-pagination">
              <span>
                File {singleFilePreviewDialog.fileIndex + 1} of {singleFilePreviewDialog.totalFiles}
              </span>
              <div className="pagination-controls">
                <Button 
                  className="pagination-button"
                  disabled={singleFilePreviewDialog.fileIndex === 0}
                  onClick={() => {
                    if (singleFilePreviewDialog.fileIndex > 0) {
                      handleViewFile(
                        singleFilePreviewDialog.expenseId,
                        singleFilePreviewDialog.fileIndex - 1
                      );
                    }
                  }}
                  startIcon={<FaChevronLeft />}
                >
                  Previous
                </Button>
                <Button 
                  className="pagination-button"
                  disabled={singleFilePreviewDialog.fileIndex >= singleFilePreviewDialog.totalFiles - 1}
                  onClick={() => {
                    if (singleFilePreviewDialog.fileIndex < singleFilePreviewDialog.totalFiles - 1) {
                      handleViewFile(
                        singleFilePreviewDialog.expenseId,
                        singleFilePreviewDialog.fileIndex + 1
                      );
                    }
                  }}
                  endIcon={<FaChevronRight />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          <div className="dialog-buttons">
            {singleFilePreviewDialog.file && (
              <Button 
                variant="contained" 
                className="download-button"
                startIcon={<FaDownload />}
                onClick={() => handleDownloadFile(singleFilePreviewDialog.file)}
              >
                Download
              </Button>
            )}
            <Button 
              variant="outlined"
              className="close-button"
              onClick={() => setSingleFilePreviewDialog({ open: false, file: null, isLoading: false, error: null })}
            >
              Close
            </Button>
          </div>
        </DialogActions>
      </Dialog>
    </div>
  );
};


const AuthenticatedExpensesList = withAuth(ExpensesList);
export default AuthenticatedExpensesList;
