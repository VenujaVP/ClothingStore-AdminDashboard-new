/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaTimes, 
  FaSearch, 
  FaToggleOn, 
  FaToggleOff, 
  FaTruck, 
  FaSort, 
  FaSortUp, 
  FaSortDown,
  FaClock,
  FaMoneyBillWave
} from 'react-icons/fa';
import './DeliveryOptions.css';
import withAuth from '../../withAuth';

const DeliveryOptions = ({ userId }) => {
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActive, setShowActive] = useState('all'); // 'all', 'active', 'inactive'
  
  // Form states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newOption, setNewOption] = useState({ 
    name: '', 
    description: '', 
    cost: '',
    estimatedDays: '', 
    isActive: true 
  });
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ 
    name: '', 
    description: '', 
    cost: '',
    estimatedDays: '',
    isActive: true 
  });
  
  // Notification
  const [message, setMessage] = useState({ text: '', type: '' });

  // Sort
  const [sortConfig, setSortConfig] = useState({ key: 'cost', direction: 'ascending' });

  // Fetch delivery options on component mount
  useEffect(() => {
    fetchDeliveryOptions();
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

  // Fetch all delivery options from API
  const fetchDeliveryOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8082/api/owner/delivery-options');
      setDeliveryOptions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching delivery options:', err);
      setError('Failed to load delivery options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new delivery option
  const handleAddDeliveryOption = async (e) => {
    e.preventDefault();
    
    if (!newOption.name.trim()) {
      setMessage({ text: 'Delivery option name is required', type: 'error' });
      return;
    }
    
    if (!newOption.cost || isNaN(parseFloat(newOption.cost)) || parseFloat(newOption.cost) < 0) {
      setMessage({ text: 'Valid delivery cost is required', type: 'error' });
      return;
    }
    
    if (!newOption.estimatedDays || isNaN(parseInt(newOption.estimatedDays)) || parseInt(newOption.estimatedDays) < 0) {
      setMessage({ text: 'Valid estimated days is required', type: 'error' });
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8082/api/owner/delivery-options', {
        name: newOption.name.trim(),
        description: newOption.description.trim(),
        cost: parseFloat(newOption.cost),
        estimatedDays: parseInt(newOption.estimatedDays),
        isActive: newOption.isActive
      });
      
      setDeliveryOptions([...deliveryOptions, response.data.deliveryOption]);
      setNewOption({ name: '', description: '', cost: '', estimatedDays: '', isActive: true });
      setIsAddingNew(false);
      setMessage({ text: 'Delivery option added successfully', type: 'success' });
    } catch (err) {
      console.error('Error adding delivery option:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to add delivery option', 
        type: 'error' 
      });
    }
  };

  // Start editing a delivery option
  const handleEditStart = (option) => {
    setEditingId(option.delivery_id);
    setEditValues({
      name: option.name,
      description: option.description || '',
      cost: option.cost.toString(),
      estimatedDays: option.estimated_days.toString(),
      isActive: option.is_active
    });
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({ name: '', description: '', cost: '', estimatedDays: '', isActive: true });
  };

  // Save edited delivery option
  const handleEditSave = async (id) => {
    if (!editValues.name.trim()) {
      setMessage({ text: 'Delivery option name cannot be empty', type: 'error' });
      return;
    }
    
    if (!editValues.cost || isNaN(parseFloat(editValues.cost)) || parseFloat(editValues.cost) < 0) {
      setMessage({ text: 'Valid delivery cost is required', type: 'error' });
      return;
    }
    
    if (!editValues.estimatedDays || isNaN(parseInt(editValues.estimatedDays)) || parseInt(editValues.estimatedDays) < 0) {
      setMessage({ text: 'Valid estimated days is required', type: 'error' });
      return;
    }
    
    try {
      const response = await axios.put(`http://localhost:8082/api/owner/delivery-options/${id}`, {
        name: editValues.name.trim(),
        description: editValues.description.trim(),
        cost: parseFloat(editValues.cost),
        estimatedDays: parseInt(editValues.estimatedDays),
        isActive: editValues.isActive
      });
      
      // Update delivery options list
      setDeliveryOptions(deliveryOptions.map(option => 
        option.delivery_id === id ? {
          ...option,
          name: editValues.name,
          description: editValues.description,
          cost: parseFloat(editValues.cost),
          estimated_days: parseInt(editValues.estimatedDays),
          is_active: editValues.isActive
        } : option
      ));
      
      setEditingId(null);
      setEditValues({ name: '', description: '', cost: '', estimatedDays: '', isActive: true });
      setMessage({ text: 'Delivery option updated successfully', type: 'success' });
    } catch (err) {
      console.error('Error updating delivery option:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to update delivery option', 
        type: 'error' 
      });
    }
  };

  // Delete a delivery option
  const handleDeleteDeliveryOption = async (id) => {
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this delivery option?')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8082/api/owner/delivery-options/${id}`);
      
      // Remove from delivery options list
      setDeliveryOptions(deliveryOptions.filter(option => option.delivery_id !== id));
      setMessage({ text: 'Delivery option deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Error deleting delivery option:', err);
      
      if (err.response?.data?.inUse) {
        setMessage({ 
          text: 'This delivery option cannot be deleted because it is being used in orders', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: err.response?.data?.message || 'Failed to delete delivery option', 
          type: 'error' 
        });
      }
    }
  };

  // Toggle delivery option active status
  const handleToggleStatus = async (option) => {
    try {
      const newStatus = !option.is_active;
      
      await axios.patch(`http://localhost:8082/api/owner/delivery-options/${option.delivery_id}/status`, {
        isActive: newStatus
      });
      
      // Update delivery options list
      setDeliveryOptions(deliveryOptions.map(opt => 
        opt.delivery_id === option.delivery_id 
          ? { ...opt, is_active: newStatus } 
          : opt
      ));
      
      setMessage({ 
        text: `Delivery option ${newStatus ? 'enabled' : 'disabled'} successfully`, 
        type: 'success' 
      });
    } catch (err) {
      console.error('Error toggling delivery option status:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to update delivery option status', 
        type: 'error' 
      });
    }
  };

  // Cancel adding new delivery option
  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewOption({ name: '', description: '', cost: '', estimatedDays: '', isActive: true });
  };

  // Handle sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get delivery time description
  const getDeliveryTimeDescription = (days) => {
    if (days === 0) {
      return 'Same day';
    } else if (days === 1) {
      return '1 day';
    } else {
      return `${days} days`;
    }
  };

  // Get sorted items
  const getSortedItems = () => {
    const sortableItems = [...filteredOptions];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Handle different data types for sorting
        if (sortConfig.key === 'is_active') {
          if (a.is_active === b.is_active) return 0;
          if (sortConfig.direction === 'ascending') {
            return a.is_active ? -1 : 1;
          } else {
            return a.is_active ? 1 : -1;
          }
        } else if (sortConfig.key === 'cost' || sortConfig.key === 'estimated_days') {
          // Numeric sorting
          const aValue = parseFloat(a[sortConfig.key]);
          const bValue = parseFloat(b[sortConfig.key]);
          
          if (sortConfig.direction === 'ascending') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        } else {
          // String sorting
          const aValue = a[sortConfig.key] || '';
          const bValue = b[sortConfig.key] || '';
          
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
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

  // Filter delivery options based on search and active status
  const filteredOptions = deliveryOptions.filter(option => {
    const matchesSearch = 
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesActive = 
      showActive === 'all' || 
      (showActive === 'active' && option.is_active) || 
      (showActive === 'inactive' && !option.is_active);
    
    return matchesSearch && matchesActive;
  });

  const sortedOptions = getSortedItems();

  if (loading) return (
    <div className="delivery-options loading-container">
      <div className="loading-spinner"></div>
      <p>Loading delivery options...</p>
    </div>
  );
  
  if (error) return (
    <div className="delivery-options error-container">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button className="retry-button" onClick={fetchDeliveryOptions}>Try Again</button>
    </div>
  );

  return (
    <div className="delivery-options-container">
      <div className="page-header">
        <div className="header-content">
          <h1><FaTruck className="header-icon" /> Delivery Options</h1>
          <p>Manage delivery options available for your customers at checkout.</p>
        </div>
        
        {message.text && (
          <div className={`message-toast ${message.type}`}>
            {message.type === 'success' ? '✓ ' : '⚠ '}
            {message.text}
          </div>
        )}
      </div>

      <div className="delivery-options-controls">
        <div className="search-and-filter">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search delivery options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <div className="filter-label">Status:</div>
            <div className="filter-buttons">
              <button 
                className={`filter-button ${showActive === 'all' ? 'active' : ''}`}
                onClick={() => setShowActive('all')}
              >
                All
              </button>
              <button 
                className={`filter-button ${showActive === 'active' ? 'active' : ''}`}
                onClick={() => setShowActive('active')}
              >
                Active
              </button>
              <button 
                className={`filter-button ${showActive === 'inactive' ? 'active' : ''}`}
                onClick={() => setShowActive('inactive')}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        <button 
          className={`add-option-button ${isAddingNew ? 'cancel' : ''}`}
          onClick={() => isAddingNew ? handleCancelAdd() : setIsAddingNew(true)}
        >
          {isAddingNew ? (
            <>
              <FaTimes /> Cancel
            </>
          ) : (
            <>
              <FaPlus /> Add Delivery Option
            </>
          )}
        </button>
      </div>

      {isAddingNew && (
        <div className="add-option-form-container">
          <form onSubmit={handleAddDeliveryOption} className="add-option-form">
            <div className="form-group">
              <label htmlFor="optionName">Delivery Option Name *</label>
              <input
                id="optionName"
                type="text"
                value={newOption.name}
                onChange={(e) => setNewOption({...newOption, name: e.target.value})}
                placeholder="e.g., Standard Delivery, Express Delivery"
                className="form-control"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="optionDescription">Description</label>
              <textarea
                id="optionDescription"
                value={newOption.description}
                onChange={(e) => setNewOption({...newOption, description: e.target.value})}
                placeholder="e.g., Delivery within 3-5 working days"
                className="form-control"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="optionCost">Cost (LKR) *</label>
              <div className="input-with-icon">
                <FaMoneyBillWave className="input-icon" />
                <input
                  id="optionCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newOption.cost}
                  onChange={(e) => setNewOption({...newOption, cost: e.target.value})}
                  placeholder="e.g., 350.00"
                  className="form-control with-icon"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="optionDays">Estimated Delivery Days *</label>
              <div className="input-with-icon">
                <FaClock className="input-icon" />
                <input
                  id="optionDays"
                  type="number"
                  min="0"
                  value={newOption.estimatedDays}
                  onChange={(e) => setNewOption({...newOption, estimatedDays: e.target.value})}
                  placeholder="e.g., 3"
                  className="form-control with-icon"
                  required
                />
              </div>
              <div className="form-hint">
                Use 0 for same-day delivery
              </div>
            </div>
            
            <div className="form-group toggle-group">
              <label>Status</label>
              <div className="toggle-container">
                <button 
                  type="button" 
                  className={`status-button ${newOption.isActive ? 'active' : 'inactive'}`}
                  onClick={() => setNewOption({...newOption, isActive: !newOption.isActive})}
                >
                  {newOption.isActive ? (
                    <>
                      <FaToggleOn /> Active
                    </>
                  ) : (
                    <>
                      <FaToggleOff /> Inactive
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancelAdd}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={!newOption.name.trim() || !newOption.cost || !newOption.estimatedDays}
              >
                Add Delivery Option
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="delivery-options-table-container">
        {sortedOptions.length === 0 ? (
          <div className="no-options-container">
            {searchTerm || showActive !== 'all' ? (
              <>
                <div className="no-results-icon">🔍</div>
                <p className="no-options-text">No delivery options match your search criteria</p>
                <div className="filter-actions">
                  {searchTerm && (
                    <button 
                      className="clear-filter-button"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </button>
                  )}
                  {showActive !== 'all' && (
                    <button 
                      className="clear-filter-button"
                      onClick={() => setShowActive('all')}
                    >
                      Show All Statuses
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="empty-list-icon">🚚</div>
                <p className="no-options-text">No delivery options have been added yet</p>
                <button 
                  className="start-adding-button"
                  onClick={() => setIsAddingNew(true)}
                >
                  <FaPlus /> Add Your First Delivery Option
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="delivery-options-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => requestSort('name')}>
                  <div className="th-content">
                    Name {getSortIcon('name')}
                  </div>
                </th>
                <th className="sortable" onClick={() => requestSort('description')}>
                  <div className="th-content">
                    Description {getSortIcon('description')}
                  </div>
                </th>
                <th className="sortable" onClick={() => requestSort('cost')}>
                  <div className="th-content">
                    Cost {getSortIcon('cost')}
                  </div>
                </th>
                <th className="sortable" onClick={() => requestSort('estimated_days')}>
                  <div className="th-content">
                    Delivery Time {getSortIcon('estimated_days')}
                  </div>
                </th>
                <th className="sortable" onClick={() => requestSort('is_active')}>
                  <div className="th-content">
                    Status {getSortIcon('is_active')}
                  </div>
                </th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOptions.map((option, index) => (
                <tr 
                  key={option.delivery_id} 
                  className={`
                    ${editingId === option.delivery_id ? 'editing-row' : ''}
                    ${index % 2 === 0 ? 'even-row' : 'odd-row'}
                    ${!option.is_active ? 'inactive-row' : ''}
                  `}
                >
                  <td>
                    {editingId === option.delivery_id ? (
                      <input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                        className="edit-input"
                        autoFocus
                      />
                    ) : (
                      <div className="option-name-cell">
                        <FaTruck className="option-icon" />
                        <span>{option.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="description-cell">
                    {editingId === option.delivery_id ? (
                      <textarea
                        value={editValues.description}
                        onChange={(e) => setEditValues({...editValues, description: e.target.value})}
                        className="edit-textarea"
                        rows={2}
                      />
                    ) : (
                      option.description || <span className="no-description">No description</span>
                    )}
                  </td>
                  <td className="cost-cell">
                    {editingId === option.delivery_id ? (
                      <div className="input-with-icon-edit">
                        <FaMoneyBillWave className="input-icon" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.cost}
                          onChange={(e) => setEditValues({...editValues, cost: e.target.value})}
                          className="edit-input with-icon"
                        />
                      </div>
                    ) : (
                      <span className="cost-value">{formatCurrency(option.cost)}</span>
                    )}
                  </td>
                  <td>
                    {editingId === option.delivery_id ? (
                      <div className="input-with-icon-edit">
                        <FaClock className="input-icon" />
                        <input
                          type="number"
                          min="0"
                          value={editValues.estimatedDays}
                          onChange={(e) => setEditValues({...editValues, estimatedDays: e.target.value})}
                          className="edit-input with-icon"
                        />
                      </div>
                    ) : (
                      <span className={`delivery-time ${option.estimated_days === 0 ? 'same-day' : ''}`}>
                        {getDeliveryTimeDescription(option.estimated_days)}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === option.delivery_id ? (
                      <div className="status-toggle-edit">
                        <button 
                          type="button" 
                          className={`status-button ${editValues.isActive ? 'active' : 'inactive'}`}
                          onClick={() => setEditValues({...editValues, isActive: !editValues.isActive})}
                        >
                          {editValues.isActive ? (
                            <>
                              <FaToggleOn /> Active
                            </>
                          ) : (
                            <>
                              <FaToggleOff /> Inactive
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className={`status-badge ${option.is_active ? 'active' : 'inactive'}`}>
                        {option.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === option.delivery_id ? (
                      <div className="table-actions">
                        <button 
                          onClick={() => handleEditSave(option.delivery_id)}
                          className="table-action-button save-button"
                          disabled={!editValues.name.trim() || !editValues.cost || !editValues.estimatedDays}
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
                          onClick={() => handleToggleStatus(option)}
                          className={`table-action-button toggle-button ${option.is_active ? 'active' : 'inactive'}`}
                          title={option.is_active ? 'Disable' : 'Enable'}
                        >
                          {option.is_active ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button 
                          onClick={() => handleEditStart(option)}
                          className="table-action-button edit-button"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteDeliveryOption(option.delivery_id)}
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
        )}
      </div>
    </div>
  );
};

const AuthenticatedDeliveryOptions = withAuth(DeliveryOptions);
export default AuthenticatedDeliveryOptions;