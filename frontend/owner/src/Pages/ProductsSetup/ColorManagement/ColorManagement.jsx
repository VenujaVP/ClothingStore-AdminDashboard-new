/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-key */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch, FaPalette } from 'react-icons/fa';
import './ColorManagement.css';
import withAuth from '../../withAuth';

const ColorManagement = ({ userId }) => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newColor, setNewColor] = useState('');
  const [editingColor, setEditingColor] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Fetch colors on component mount
  useEffect(() => {
    fetchColors();
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

  // Fetch all colors from API
  const fetchColors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8082/api/owner/colors');
      setColors(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching colors:', err);
      setError('Failed to load colors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add new color
  const handleAddColor = async (e) => {
    e.preventDefault();
    
    if (!newColor.trim()) {
      setMessage({ text: 'Please enter a color value', type: 'error' });
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8082/api/owner/colors', {
        colorValue: newColor.trim()
      });
      
      setColors([...colors, response.data.color]);
      setNewColor('');
      setMessage({ text: 'Color added successfully', type: 'success' });
    } catch (err) {
      console.error('Error adding color:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to add color', 
        type: 'error' 
      });
    }
  };

  // Start editing a color
  const handleEditStart = (color) => {
    setEditingColor(color.ColorID);
    setEditValue(color.ColorValue);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingColor(null);
    setEditValue('');
  };

  // Save edited color
  const handleEditSave = async (colorId) => {
    if (!editValue.trim()) {
      setMessage({ text: 'Color value cannot be empty', type: 'error' });
      return;
    }
    
    try {
      const response = await axios.put(`http://localhost:8082/api/owner/colors/${colorId}`, {
        colorValue: editValue.trim()
      });
      
      // Update colors list
      setColors(colors.map(color => 
        color.ColorID === colorId ? { ...color, ColorValue: editValue } : color
      ));
      
      setEditingColor(null);
      setEditValue('');
      setMessage({ text: 'Color updated successfully', type: 'success' });
    } catch (err) {
      console.error('Error updating color:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to update color', 
        type: 'error' 
      });
    }
  };

  // Delete a color
  const handleDeleteColor = async (colorId) => {
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this color?')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8082/api/owner/colors/${colorId}`);
      
      // Remove from colors list
      setColors(colors.filter(color => color.ColorID !== colorId));
      setMessage({ text: 'Color deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Error deleting color:', err);
      
      if (err.response?.data?.inUse) {
        setMessage({ 
          text: 'This color cannot be deleted because it is being used in products', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: err.response?.data?.message || 'Failed to delete color', 
          type: 'error' 
        });
      }
    }
  };

  // Check if color is a valid CSS color
  const isValidColor = (color) => {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  };

  // Filter colors based on search term
  const filteredColors = colors.filter(color => 
    color.ColorValue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="color-management loading-container">
      <div className="loading-spinner"></div>
      <p>Loading colors...</p>
    </div>
  );
  
  if (error) return (
    <div className="color-management error-container">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button className="retry-button" onClick={fetchColors}>Try Again</button>
    </div>
  );

  return (
    <div className="color-management-container">
      <div className="page-header">
        <div className="header-content">
          <h1><FaPalette className="header-icon" /> Color Management</h1>
          <p>Add, edit, or remove colors that will be available for products.</p>
        </div>
        
        {message.text && (
          <div className={`message-toast ${message.type}`}>
            {message.type === 'success' ? '✓ ' : '⚠ '}
            {message.text}
          </div>
        )}
      </div>

      <div className="color-dashboard">
        <div className="dashboard-panel add-color-panel">
          <div className="panel-header">
            <h2>Add New Color</h2>
          </div>
          
          <div className="panel-body">
            <form onSubmit={handleAddColor} className="add-color-form">
              <div className="color-input-group">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Enter color name or #hex code"
                  className="color-input"
                />
                <input 
                  type="color"
                  className="color-picker"
                  value={isValidColor(newColor) ? newColor : '#000000'}
                  onChange={(e) => setNewColor(e.target.value)}
                  title="Choose color"
                />
              </div>
              
              {newColor && (
                <div className="color-preview-container">
                  <div 
                    className="color-preview-swatch" 
                    style={{ 
                      backgroundColor: isValidColor(newColor) ? newColor : '#cccccc'
                    }}
                  ></div>
                  <div className="color-preview-info">
                    <span className="preview-label">Preview:</span>
                    <span className="preview-value">{newColor}</span>
                    {!isValidColor(newColor) && 
                      <span className="preview-warning">Invalid color format</span>
                    }
                  </div>
                </div>
              )}
              
              <button 
                type="submit" 
                className="add-color-button"
                disabled={!newColor.trim() || !isValidColor(newColor)}
              >
                <FaPlus /> Add Color
              </button>
            </form>
            
            <div className="color-tips">
              <h3>Tips:</h3>
              <ul>
                <li>Use color names like "red", "blue", "navy"</li>
                <li>Use hex codes like "#ff0000", "#0000ff"</li>
                <li>Use rgb format like "rgb(255, 0, 0)"</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="dashboard-panel colors-list-panel">
          <div className="panel-header with-search">
            <h2>Available Colors</h2>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search colors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="panel-body">
            {filteredColors.length === 0 ? (
              <div className="no-colors-container">
                {searchTerm ? (
                  <>
                    <div className="no-results-icon">🔍</div>
                    <p className="no-colors-text">No colors match your search</p>
                    <button 
                      className="clear-search-button"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <div className="empty-list-icon">🎨</div>
                    <p className="no-colors-text">No colors have been added yet</p>
                    <p className="no-colors-subtext">Add your first color using the form on the left</p>
                  </>
                )}
              </div>
            ) : (
              <div className="colors-grid">
                {filteredColors.map(color => (
                  <div key={color.ColorID} className="color-card">
                    {editingColor === color.ColorID ? (
                      <div className="color-card-editing">
                        <div className="edit-form">
                          <div className="edit-input-group">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="edit-text-input"
                            />
                            <input 
                              type="color"
                              className="edit-color-picker"
                              value={isValidColor(editValue) ? editValue : '#000000'}
                              onChange={(e) => setEditValue(e.target.value)}
                            />
                          </div>
                          
                          <div 
                            className="edit-color-preview" 
                            style={{ 
                              backgroundColor: isValidColor(editValue) ? editValue : '#cccccc'
                            }}
                          ></div>
                          
                          <div className="edit-actions">
                            <button 
                              onClick={() => handleEditSave(color.ColorID)}
                              className="edit-save-button"
                              disabled={!editValue.trim() || !isValidColor(editValue)}
                              title="Save"
                            >
                              <FaCheck /> Save
                            </button>
                            <button 
                              onClick={handleEditCancel}
                              className="edit-cancel-button"
                              title="Cancel"
                            >
                              <FaTimes /> Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="color-card-header">
                          <div 
                            className="color-card-swatch" 
                            style={{ 
                              backgroundColor: isValidColor(color.ColorValue) ? color.ColorValue : '#cccccc'
                            }}
                          ></div>
                        </div>
                        <div className="color-card-body">
                          <span className="color-card-name">{color.ColorValue}</span>
                          <div className="color-card-actions">
                            <button 
                              onClick={() => handleEditStart(color)}
                              className="color-edit-button"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              onClick={() => handleDeleteColor(color.ColorID)}
                              className="color-delete-button"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthenticatedColorManagement = withAuth(ColorManagement);
export default AuthenticatedColorManagement;
