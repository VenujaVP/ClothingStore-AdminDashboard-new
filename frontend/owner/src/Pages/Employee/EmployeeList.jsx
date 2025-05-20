/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState, useEffect } from 'react';
import withAuth from '../withAuth';
import './EmployeeList.css';
import { 
  FaSearch, FaEdit, FaTrash, FaSort, FaFilter, FaEye, 
  FaUserShield, FaTimes, FaExclamationTriangle, FaCheck,
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaIdCard
} from 'react-icons/fa';
import axios from 'axios';
import { 
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Avatar, Divider, Typography, Paper, Grid, Box, Chip
} from '@mui/material';

const EmployeeList = () => {
  // State for employees data
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [filters, setFilters] = useState({
    role: '',
    startDate: '',
    endDate: '',
  });
  
  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, employee: null });
  const [editDialog, setEditDialog] = useState({ open: false, employee: null });
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_1: '',
    phone_2: '',
    role: '',
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  // Alerts
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Function to fetch employees from API
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8082/api/owner/employees');
      if (response.data && response.data.Status === 'success') {
        setEmployees(response.data.employees);
      } else {
        throw new Error(response.data.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Failed to load employee data',
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

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort employees
  const sortedEmployees = [...employees].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  // Filter employees based on search query and filters
  const filteredEmployees = sortedEmployees.filter((employee) => {
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) || 
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filters.role ? employee.role === filters.role : true;
    
    // Date filtering based on createdAt instead of entry_date
    let matchesDate = true;
    if (filters.startDate && filters.endDate) {
      const creationDate = new Date(employee.createdAt);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      matchesDate = creationDate >= startDate && creationDate <= endDate;
    } else if (filters.startDate) {
      const creationDate = new Date(employee.createdAt);
      const startDate = new Date(filters.startDate);
      matchesDate = creationDate >= startDate;
    } else if (filters.endDate) {
      const creationDate = new Date(employee.createdAt);
      const endDate = new Date(filters.endDate);
      matchesDate = creationDate <= endDate;
    }

    return matchesSearch && matchesRole && matchesDate;
  });

  // View employee details
  const handleViewEmployee = (employee) => {
    setViewDialog({ open: true, employee });
  };

  // Close view dialog
  const handleCloseViewDialog = () => {
    setViewDialog({ open: false, employee: null });
  };

  // Open edit dialog
  const handleEditEmployee = (employee) => {
    setEditForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone_1: employee.phone_1,
      phone_2: employee.phone_2 || '',
      role: employee.role,
    });
    setFormErrors({});
    setEditDialog({ open: true, employee });
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, employee: null });
    setFormErrors({});
  };

  // Handle edit form input changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    
    if (!editForm.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    
    if (!editForm.last_name.trim()) {
      errors.last_name = "Last name is required";
    }
    
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(editForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!editForm.phone_1.trim()) {
      errors.phone_1 = "Primary phone number is required";
    } else if (!phoneRegex.test(editForm.phone_1.replace(/[^0-9]/g, ''))) {
      errors.phone_1 = "Phone number must be 10 digits";
    }
    
    if (editForm.phone_2 && !phoneRegex.test(editForm.phone_2.replace(/[^0-9]/g, ''))) {
      errors.phone_2 = "Phone number must be 10 digits";
    }
    
    if (!editForm.role.trim()) {
      errors.role = "Role is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit edit form
  const handleSubmitEdit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await axios.put(
        `http://localhost:8082/api/owner/employees/${editDialog.employee.id}`,
        {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone_1: editForm.phone_1,
          phone_2: editForm.phone_2,
          role: editForm.role,
        }
      );
      
      if (response.data && response.data.Status === 'success') {
        // Close dialog and refresh employee list
        setEditDialog({ open: false, employee: null });
        fetchEmployees();
        setAlert({
          open: true,
          message: 'Employee updated successfully',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Error updating employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Error updating employee',
        severity: 'error'
      });
    }
  };

  // Open delete confirmation dialog
  const handleConfirmDelete = (id) => {
    setConfirmDialog({ open: true, id });
  };

  // Close delete confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, id: null });
  };

  // Delete employee
  const handleDeleteEmployee = async () => {
    if (!confirmDialog.id) return;
    
    try {
      const response = await axios.delete(`http://localhost:8082/api/owner/employees/${confirmDialog.id}`);
      
      if (response.data && response.data.Status === 'success') {
        // Update employee list
        setEmployees(employees.filter(employee => employee.id !== confirmDialog.id));
        setAlert({
          open: true,
          message: 'Employee deleted successfully',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Error deleting employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Error deleting employee',
        severity: 'error'
      });
    } finally {
      // Close confirmation dialog
      setConfirmDialog({ open: false, id: null });
    }
  };
  
  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };
  
  // Get background color for role badges
  const getRoleBadgeColor = (role) => {
    switch(role?.toLowerCase()) {
      case 'cashier': return '#4caf50'; // Green for cashier
      case 'employee': return '#2196f3'; // Blue for employee
      case 'onlineorderchecker': return '#ff9800'; // Orange for online order checker
      default: return '#9e9e9e'; // Grey for unknown roles
    }
  };
  
  // Role display name formatter
  const formatRoleName = (role) => {
    switch(role?.toLowerCase()) {
      case 'admin': return 'Admin';
      case 'cashier': return 'Cashier';
      case 'employee': return 'Employee';
      case 'onlineorderchecker': return 'Online Order Checker';
      default: return role || 'Unknown';
    }
  };

  return (
    <div className="employee-list-container">
      <div className="employee-list-card">
        <div className="employee-header">
          <div className="employee-title">
            <FaUserShield className="title-icon" />
            <h2>Employee Management</h2>
          </div>
          <div className="employee-stats">
            <div className="stat-box">
              <span className="stat-value">{employees.length}</span>
              <span className="stat-label">Total Employees</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">
                {employees.filter(emp => emp.role === 'cashier').length}
              </span>
              <span className="stat-label">Cashiers</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">
                {employees.filter(emp => emp.role === 'employee').length}
              </span>
              <span className="stat-label">Employees</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">
                {employees.filter(emp => emp.role === 'onlineorderchecker').length}
              </span>
              <span className="stat-label">Order Checkers</span>
            </div>
          </div>
        </div>
        
        <div className="search-filter-container">
          <div className="search-bar">
            <div className="input-group">
              <FaSearch className="input-icon" />
              <input
                type="text"
                placeholder="Search employees by name, email, or username..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <div className="filter-section">
            <h3>
              <FaFilter /> Filter Employees
            </h3>
            <div className="filter-options">
              <div className="filter-group">
                <label>Role</label>
                <select name="role" value={filters.role} onChange={handleFilterChange}>
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                  <option value="cashier">Cashier</option>
                  <option value="onlineorderchecker">Online Order Checker</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Registration Date Range</label>
                <div className="date-range">
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading employees...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="employee-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>
                    ID 
                    <span className="sort-indicator">
                      {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('username')}>
                    Username
                    <span className="sort-indicator">
                      {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('first_name')}>
                    Full Name
                    <span className="sort-indicator">
                      {sortConfig.key === 'first_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('email')}>
                    Email
                    <span className="sort-indicator">
                      {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('phone_1')}>
                    Phone
                    <span className="sort-indicator">
                      {sortConfig.key === 'phone_1' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('role')}>
                    Role
                    <span className="sort-indicator">
                      {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('createdAt')}>
                    Register Date
                    <span className="sort-indicator">
                      {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.username}</td>
                    <td className="employee-name-cell">
                      <div className="name-with-avatar">
                        <div className="employee-avatar" style={{backgroundColor: getRoleBadgeColor(employee.role)}}>
                          {getInitials(employee.first_name, employee.last_name)}
                        </div>
                        <div>
                          {`${employee.first_name} ${employee.last_name}`}
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">{employee.email}</td>
                    <td>{employee.phone_1}</td>
                    <td>
                      <div 
                        className="role-badge" 
                        style={{ backgroundColor: getRoleBadgeColor(employee.role) }}
                      >
                        {formatRoleName(employee.role)}
                      </div>
                    </td>
                    <td>{new Date(employee.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view-btn" onClick={() => handleViewEmployee(employee)} title="View details">
                          <FaEye />
                        </button>
                        <button className="action-btn edit-btn" onClick={() => handleEditEmployee(employee)} title="Edit employee">
                          <FaEdit />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleConfirmDelete(employee.id)} title="Delete employee">
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
        
        {!loading && filteredEmployees.length === 0 && (
          <div className="no-results">
            <FaExclamationTriangle className="no-results-icon" />
            <p>No employees match your search criteria</p>
            <button 
              className="reset-filters-btn" 
              onClick={() => {
                setSearchQuery('');
                setFilters({ role: '', startDate: '', endDate: '' });
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Enhanced View Employee Dialog */}
      <Dialog 
        open={viewDialog.open} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        className="employee-view-dialog"
      >
        <DialogTitle className="view-dialog-title">
          <Button 
            onClick={handleCloseViewDialog} 
            className="close-dialog-btn"
            variant="outlined"
          >
            <FaTimes />
          </Button>
        </DialogTitle>
        <DialogContent className="view-dialog-content">
          {viewDialog.employee && (
            <div className="employee-profile">
              <div className="profile-header">
                <div 
                  className="profile-avatar"
                  style={{backgroundColor: getRoleBadgeColor(viewDialog.employee.role)}}
                >
                  {getInitials(viewDialog.employee.first_name, viewDialog.employee.last_name)}
                </div>
                <div className="profile-title">
                  <h2>{`${viewDialog.employee.first_name} ${viewDialog.employee.last_name}`}</h2>
                  <div 
                    className="profile-role"
                    style={{ backgroundColor: getRoleBadgeColor(viewDialog.employee.role) }}
                  >
                    {formatRoleName(viewDialog.employee.role)}
                  </div>
                  <p className="username">@{viewDialog.employee.username}</p>
                </div>
              </div>
              
              <div className="profile-content">
                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-icon">
                        <FaIdCard />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Employee ID</span>
                        <span className="info-value">{viewDialog.employee.id}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">
                        <FaEnvelope />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Email Address</span>
                        <span className="info-value">{viewDialog.employee.email}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">
                        <FaPhone />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Primary Phone</span>
                        <span className="info-value">{viewDialog.employee.phone_1}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">
                        <FaPhone />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Secondary Phone</span>
                        <span className="info-value">
                          {viewDialog.employee.phone_2 || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="profile-section">
                  <h3>Employment Details</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-icon">
                        <FaCalendarAlt />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Registration Date</span>
                        <span className="info-value">
                          {new Date(viewDialog.employee.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">
                        <FaUserShield />
                      </div>
                      <div className="info-content">
                        <span className="info-label">Account Type</span>
                        <span className="info-value">Staff Account</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="profile-section">
                  <h3>System Information</h3>
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <div className="info-content">
                        <span className="info-label">Account Created</span>
                        <span className="info-value">
                          {new Date(viewDialog.employee.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="info-item full-width">
                      <div className="info-content">
                        <span className="info-label">Last Updated</span>
                        <span className="info-value">
                          {new Date(viewDialog.employee.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="profile-actions">
                <Button 
                  variant="contained" 
                  color="primary"
                  className="action-button" 
                  startIcon={<FaEdit />}
                  onClick={() => {
                    handleCloseViewDialog();
                    handleEditEmployee(viewDialog.employee);
                  }}
                >
                  Edit Employee
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  className="action-button"
                  startIcon={<FaTrash />}
                  onClick={() => {
                    handleCloseViewDialog();
                    handleConfirmDelete(viewDialog.employee.id);
                  }}
                >
                  Delete Employee
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Improved Edit Employee Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        className="employee-edit-dialog"
      >
        <DialogTitle className="edit-dialog-title">
          <div className="edit-dialog-header">
            <div className="edit-dialog-icon">
              <FaEdit />
            </div>
            <div className="edit-dialog-text">
              <h2>Edit Employee</h2>
              <p>Update information for {editDialog.employee?.first_name} {editDialog.employee?.last_name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={handleCloseEditDialog}>
            <FaTimes />
          </button>
        </DialogTitle>
        <DialogContent className="edit-dialog-content">
          {editDialog.employee && (
            <div className="edit-form">
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <TextField
                      label="First Name"
                      name="first_name"
                      value={editForm.first_name}
                      onChange={handleEditFormChange}
                      fullWidth
                      variant="outlined"
                      error={!!formErrors.first_name}
                      helperText={formErrors.first_name}
                      InputProps={{
                        startAdornment: <FaUser className="input-icon-material" />,
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <TextField
                      label="Last Name"
                      name="last_name"
                      value={editForm.last_name}
                      onChange={handleEditFormChange}
                      fullWidth
                      variant="outlined"
                      error={!!formErrors.last_name}
                      helperText={formErrors.last_name}
                      InputProps={{
                        startAdornment: <FaUser className="input-icon-material" />,
                      }}
                    />
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <TextField
                    label="Email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    fullWidth
                    variant="outlined"
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    InputProps={{
                      startAdornment: <FaEnvelope className="input-icon-material" />,
                    }}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <TextField
                      label="Primary Phone"
                      name="phone_1"
                      value={editForm.phone_1}
                      onChange={handleEditFormChange}
                      fullWidth
                      variant="outlined"
                      error={!!formErrors.phone_1}
                      helperText={formErrors.phone_1}
                      InputProps={{
                        startAdornment: <FaPhone className="input-icon-material" />,
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <TextField
                      label="Secondary Phone (Optional)"
                      name="phone_2"
                      value={editForm.phone_2}
                      onChange={handleEditFormChange}
                      fullWidth
                      variant="outlined"
                      error={!!formErrors.phone_2}
                      helperText={formErrors.phone_2}
                      InputProps={{
                        startAdornment: <FaPhone className="input-icon-material" />,
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3 className="section-title">Role Assignment</h3>
                
                <div className="form-group full-width">
                  <FormControl fullWidth variant="outlined" error={!!formErrors.role}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={editForm.role}
                      onChange={handleEditFormChange}
                      label="Role"
                      startAdornment={<FaUserShield className="input-icon-material" />}
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="employee">Employee</MenuItem>
                      <MenuItem value="cashier">Cashier</MenuItem>
                      <MenuItem value="onlineorderchecker">Online Order Checker</MenuItem>
                    </Select>
                    {formErrors.role && (
                      <span className="error-text">{formErrors.role}</span>
                    )}
                  </FormControl>
                  
                  <div className="role-description">
                    {editForm.role === 'admin' && (
                      <p>Admins have full access to all system features and can manage other users.</p>
                    )}
                    {editForm.role === 'cashier' && (
                      <p>Cashiers have permissions to handle sales transactions, manage the cash register, and access customer information.</p>
                    )}
                    {editForm.role === 'employee' && (
                      <p>Employees have general access to store operations, inventory management, and basic reporting features.</p>
                    )}
                    {editForm.role === 'onlineorderchecker' && (
                      <p>Online Order Checkers manage e-commerce orders, track shipments, and process online customer requests.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="form-section info-section">
                <div className="info-icon">
                  <FaExclamationTriangle />
                </div>
                <div className="info-content">
                  <h4>Non-Editable Information</h4>
                  <p>The following information cannot be modified:</p>
                  <div className="non-editable-items">
                    <div className="non-editable-item">
                      <span className="item-label">Username:</span>
                      <span className="item-value">{editDialog.employee.username}</span>
                    </div>
                    <div className="non-editable-item">
                      <span className="item-label">Register Date:</span>
                      <span className="item-value">{new Date(editDialog.employee.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="non-editable-item">
                      <span className="item-label">Employee ID:</span>
                      <span className="item-value">{editDialog.employee.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="edit-dialog-actions">
          <Button 
            onClick={handleCloseEditDialog} 
            color="inherit" 
            variant="outlined"
            className="cancel-button"
            startIcon={<FaTimes />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitEdit} 
            color="primary" 
            variant="contained"
            className="save-button"
            startIcon={<FaCheck />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Improved Delete Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
        className="delete-dialog"
      >
        <DialogTitle className="delete-dialog-title">
          <div className="delete-icon">
            <FaExclamationTriangle />
          </div>
          <div className="delete-title-text">
            Confirm Employee Deletion
          </div>
        </DialogTitle>
        <DialogContent className="delete-dialog-content">
          <div className="delete-warning">
            <p className="warning-primary">Are you sure you want to delete this employee?</p>
            <p className="warning-secondary">This action cannot be undone. All data associated with this employee will be permanently removed from the system.</p>
            <div className="warning-details">
              <ul>
                <li>Employee account will be removed</li>
                <li>Login access will be revoked immediately</li>
                <li>Employment history will be deleted</li>
              </ul>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="delete-dialog-actions">
          <Button 
            onClick={handleCloseConfirmDialog} 
            color="inherit" 
            variant="outlined"
            className="cancel-delete-button"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteEmployee} 
            color="error" 
            variant="contained"
            className="confirm-delete-button"
            startIcon={<FaTrash />}
          >
            Delete Employee
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={() => setAlert({...alert, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert({...alert, open: false})} 
          severity={alert.severity} 
          sx={{ width: '100%' }}
          icon={alert.severity === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

const AuthenticatedEmployeeList = withAuth(EmployeeList);
export default AuthenticatedEmployeeList;