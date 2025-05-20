/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch, FaRuler, FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';
import './SizeManagement.css';
import withAuth from '../../withAuth';

const SizeManagement = ({ userId }) => {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSize, setNewSize] = useState('');
  const [editingSize, setEditingSize] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'SizeID', direction: 'ascending' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Size categories for organization
  const sizeCategories = [
    { id: 'all', name: 'All Sizes' },
    { id: 'apparel', name: 'Apparel (S/M/L)' },
    { id: 'numeric', name: 'Numeric (32/34/36)' },
  ];

  // Fetch sizes on component mount
  useEffect(() => {
    fetchSizes();
  }, []);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch all sizes from API
  const fetchSizes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8082/api/owner/sizes');
      setSizes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sizes:', err);
      setError('Failed to load sizes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add new size
  const handleAddSize = async (e) => {
    e.preventDefault();
    
    if (!newSize.trim()) {
      setMessage({ text: 'Please enter a size value', type: 'error' });
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8082/api/owner/sizes', {
        sizeValue: newSize.trim()
      });
      
      setSizes([...sizes, response.data.size]);
      setNewSize('');
      setMessage({ text: 'Size added successfully', type: 'success' });
    } catch (err) {
      console.error('Error adding size:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to add size', 
        type: 'error' 
      });
    }
  };

  // Sort handler
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted items
  const getSortedItems = () => {
    const sortableItems = [...filteredSizes];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  };

  // Get sort icon
  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  // Start editing a size
  const handleEditStart = (size) => {
    setEditingSize(size.SizeID);
    setEditValue(size.SizeValue);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingSize(null);
    setEditValue('');
  };

  // Save edited size
  const handleEditSave = async (sizeId) => {
    if (!editValue.trim()) {
      setMessage({ text: 'Size value cannot be empty', type: 'error' });
      return;
    }
    
    try {
      const response = await axios.put(`http://localhost:8082/api/owner/sizes/${sizeId}`, {
        sizeValue: editValue.trim()
      });
      
      // Update sizes list
      setSizes(sizes.map(size => 
        size.SizeID === sizeId ? { ...size, SizeValue: editValue } : size
      ));
      
      setEditingSize(null);
      setEditValue('');
      setMessage({ text: 'Size updated successfully', type: 'success' });
    } catch (err) {
      console.error('Error updating size:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to update size', 
        type: 'error' 
      });
    }
  };

  // Delete a size
  const handleDeleteSize = async (sizeId) => {
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this size?')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8082/api/owner/sizes/${sizeId}`);
      
      // Remove from sizes list
      setSizes(sizes.filter(size => size.SizeID !== sizeId));
      setMessage({ text: 'Size deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Error deleting size:', err);
      
      if (err.response?.data?.inUse) {
        setMessage({ 
          text: 'This size cannot be deleted because it is being used in products', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: err.response?.data?.message || 'Failed to delete size', 
          type: 'error' 
        });
      }
    }
  };
  
  // Function to detect size category
  const getSizeCategory = (sizeValue) => {
    const sizeStr = String(sizeValue).toLowerCase();
    if (['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'].includes(sizeStr)) {
      return 'apparel';
    } else if (!isNaN(sizeStr) || sizeStr.match(/^\d+$/)) {
      return 'numeric';
    }
    return 'other';
  };

  // Filter sizes based on search term and category
  const filteredSizes = sizes.filter(size => {
    const matchesSearch = size.SizeValue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || getSizeCategory(size.SizeValue) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Function to get size badge class based on category
  const getSizeBadgeClass = (sizeValue) => {
    const category = getSizeCategory(sizeValue);
    return `size-badge ${category}`;
  };

  const sortedSizes = getSortedItems();

  if (loading) return (
    <div className="size-management loading-container">
      <div className="loading-spinner"></div>
      <p>Loading sizes...</p>
    </div>
  );
  
  if (error) return (
    <div className="size-management error-container">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button className="retry-button" onClick={fetchSizes}>Try Again</button>
    </div>
  );

  return (
    <div className="size-management-container">
      <div className="page-header">
        <div className="header-content">
          <h1><FaRuler className="header-icon" /> Size Management</h1>
          <p>Add, edit, or remove sizes that will be available for products.</p>
        </div>
        
        {message.text && (
          <div className={`message-toast ${message.type}`}>
            {message.type === 'success' ? '✓ ' : '⚠ '}
            {message.text}
          </div>
        )}
      </div>

      <div className="size-dashboard">
        <div className="dashboard-sidebar">
          <div className="dashboard-panel add-size-panel">
            <div className="panel-header">
              <h2>Add New Size</h2>
            </div>
            
            <div className="panel-body">
              <form onSubmit={handleAddSize} className="add-size-form">
                <div className="form-group">
                  <label htmlFor="newSize">Size Value</label>
                  <div className="size-input-group">
                    <input
                      id="newSize"
                      type="text"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="Enter size value (e.g., S, M, L)"
                      className="size-input"
                    />
                  </div>
                </div>
                
                <div className="form-preview">
                  {newSize && (
                    <div className="size-preview">
                      <span className={getSizeBadgeClass(newSize)}>{newSize}</span>
                      <span className="preview-label">
                        Category: {sizeCategories.find(c => c.id === getSizeCategory(newSize))?.name || 'Other'}
                      </span>
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="add-size-button"
                  disabled={!newSize.trim()}
                >
                  <FaPlus /> Add Size
                </button>
              </form>
              
              <div className="size-tips">
                <h3>Size Guidelines:</h3>
                <ul>
                  <li><span className="size-badge apparel">S</span> Apparel: XS, S, M, L, XL, XXL</li>
                  <li><span className="size-badge numeric">32</span> Numeric: 32, 34, 36, 38</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="dashboard-panel filter-panel">
            <div className="panel-header">
              <h2>Filter Sizes</h2>
            </div>
            
            <div className="panel-body">
              <div className="filter-options">
                {sizeCategories.map(category => (
                  <div 
                    key={category.id}
                    className={`filter-option ${selectedCategory === category.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className={`category-indicator ${category.id}`}></span>
                    {category.name}
                    {selectedCategory === category.id && <span className="selected-mark">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-panel sizes-list-panel">
          <div className="panel-header with-search">
            <div className="panel-header-row">
              <h2>Available Sizes</h2>
              <div className="header-actions">
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search sizes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="size-count">
                  <span>{filteredSizes.length} size{filteredSizes.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="panel-body">
            {filteredSizes.length === 0 ? (
              <div className="no-sizes-container">
                {searchTerm || selectedCategory !== 'all' ? (
                  <>
                    <div className="no-results-icon">🔍</div>
                    <p className="no-sizes-text">No sizes match your search criteria</p>
                    <div className="filter-actions">
                      {searchTerm && (
                        <button 
                          className="clear-filter-button"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear Search
                        </button>
                      )}
                      {selectedCategory !== 'all' && (
                        <button 
                          className="clear-filter-button"
                          onClick={() => setSelectedCategory('all')}
                        >
                          Show All Categories
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="empty-list-icon">📏</div>
                    <p className="no-sizes-text">No sizes have been added yet</p>
                    <p className="no-sizes-subtext">Add your first size using the form on the left</p>
                  </>
                )}
              </div>
            ) : (
              <div className="sizes-table-container">
                <table className="sizes-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => requestSort('SizeID')}>
                        <div className="th-content">
                          ID {getSortIcon('SizeID')}
                        </div>
                      </th>
                      <th className="sortable" onClick={() => requestSort('SizeValue')}>
                        <div className="th-content">
                          Size Value {getSortIcon('SizeValue')}
                        </div>
                      </th>
                      <th>Category</th>
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSizes.map((size, index) => (
                      <tr 
                        key={size.SizeID} 
                        className={`
                          ${editingSize === size.SizeID ? 'editing-row' : ''}
                          ${index % 2 === 0 ? 'even-row' : 'odd-row'}
                        `}
                      >
                        <td>{size.SizeID}</td>
                        <td>
                          {editingSize === size.SizeID ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="edit-size-input"
                              autoFocus
                            />
                          ) : (
                            <span className={getSizeBadgeClass(size.SizeValue)}>
                              {size.SizeValue}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="size-category">
                            {sizeCategories.find(c => c.id === getSizeCategory(size.SizeValue))?.name || 'Other'}
                          </span>
                        </td>
                        <td>
                          {editingSize === size.SizeID ? (
                            <div className="table-actions">
                              <button 
                                onClick={() => handleEditSave(size.SizeID)}
                                className="table-action-button save-button"
                                disabled={!editValue.trim()}
                                title="Save"
                              >
                                <FaCheck />
                              </button>
                              <button 
                                onClick={handleEditCancel}
                                className="table-action-button cancel-button"
                                title="Cancel"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <div className="table-actions">
                              <button 
                                onClick={() => handleEditStart(size)}
                                className="table-action-button edit-button"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                onClick={() => handleDeleteSize(size.SizeID)}
                                className="table-action-button delete-button"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthenticatedSizeManagement = withAuth(SizeManagement);
export default AuthenticatedSizeManagement;