// pages/Products/ProductList.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import withAuth from '../withAuth';
import './ProductList.css';
import axios from 'axios';
// Add these imports
import { 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaSort, 
  FaFilter, 
  FaEye, 
  FaPlusCircle,
  FaSortAmountDownAlt,
  FaSortAmountUpAlt,
  FaExclamationTriangle,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
  FaBoxOpen,
  FaBox,
  FaImage,
  FaToggleOn,
  FaToggleOff,
  FaBoxes,
  FaHeart,
  FaStar,
  FaCheck,
  FaSync
} from 'react-icons/fa';

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  CircularProgress,
  Typography,
  Box,
  Chip,
  Alert,
  Snackbar,
  Pagination,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  IconButton
} from '@mui/material';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', order: 'DESC' });
  const [filters, setFilters] = useState({
    category1: '',
    category2: '',
    category3: '',
    minPrice: '',
    maxPrice: '',
    inStock: '',
    status: ''
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  
  // Filter options
  const [categoryOptions, setCategoryOptions] = useState({
    category1: [],
    category2: [],
    category3: []
  });
  
  // Alert and dialog states
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    productId: null, 
    productName: '', 
    currentStatus: true,
    title: '',
    message: '',
    action: ''
  });
  const [viewDialog, setViewDialog] = useState({ open: false, product: null, loading: false });
  
  const navigate = useNavigate();

  // Fetch products on mount and when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.limit, sortConfig, filters, searchQuery]);

  // Fetch all products with filtering, sorting, and pagination
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortField: sortConfig.field,
        sortOrder: sortConfig.order,
        search: searchQuery
      });
      
      // Add filter params if they exist
      if (filters.category1) params.append('category1', filters.category1);
      if (filters.category2) params.append('category2', filters.category2);
      if (filters.category3) params.append('category3', filters.category3);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.inStock !== '') params.append('inStock', filters.inStock);
      if (filters.status !== '') params.append('status', filters.status);
      
      const response = await axios.get(`http://localhost:8082/api/owner/products?${params.toString()}`);
      
      if (response.data && response.data.Status === 'success') {
        setProducts(response.data.products);
        setPagination({
          ...pagination,
          totalItems: response.data.pagination.totalItems,
          totalPages: response.data.pagination.totalPages
        });
        
        // Update category options if available
        if (response.data.filterOptions) {
          setCategoryOptions(response.data.filterOptions);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Error loading products');
      setAlertInfo({
        open: true,
        message: 'Failed to load products. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Reset to first page when search changes
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      category1: '',
      category2: '',
      category3: '',
      minPrice: '',
      maxPrice: '',
      inStock: '',
      status: ''
    });
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sorting
  const handleSort = (field) => {
    let order = 'ASC';
    if (sortConfig.field === field && sortConfig.order === 'ASC') {
      order = 'DESC';
    }
    setSortConfig({ field, order });
  };

  // Handle pagination change
  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  // Handle view product details
  const handleViewProduct = async (productId) => {
    setViewDialog({ open: true, product: null, loading: true, productId }); // Store productId for retry
    
    try {
      const response = await axios.get(`http://localhost:8082/api/owner/products/${productId}`);
      
      if (response.data && response.data.Status === 'success') {
        // Process images to ensure they have correct URLs
        const productData = response.data.product;
        
        // For each image, make sure we have the full URL path
        if (productData.images && productData.images.length > 0) {
          productData.images = productData.images.map((img, index) => ({
            ...img,
            image_url: `http://localhost:8082/api/owner/products/${productId}/images/${index}`
          }));
        }
        
        setViewDialog({ 
          open: true, 
          product: productData, 
          loading: false,
          productId
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch product details');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setViewDialog({ 
        open: true, 
        product: null, 
        loading: false, 
        error: err.message || 'Error loading product details',
        productId
      });
    }
  };

  // Handle edit product
  const handleEditProduct = (productId) => {
    navigate(`/products/edit/${productId}`);
  };

  // Handle toggle product status confirmation
  const handleToggleStatusConfirm = (product) => {
    const isCurrentlyActive = product.IsActive;
    
    setConfirmDialog({
      open: true,
      productId: product.ProductID,
      productName: product.ProductName,
      currentStatus: isCurrentlyActive,
      title: isCurrentlyActive ? 'Deactivate Product' : 'Activate Product',
      message: isCurrentlyActive 
        ? `Are you sure you want to deactivate "${product.ProductName}"? This product will no longer be visible to customers.`
        : `Are you sure you want to activate "${product.ProductName}"? This product will become visible to customers.`,
      action: isCurrentlyActive ? 'Deactivate' : 'Activate'
    });
  };

  // Handle actual status toggle operation
  const handleToggleStatus = async () => {
    const { productId, currentStatus } = confirmDialog;
    const newStatus = !currentStatus;
    
    try {
      console.log(`Attempting to change product ${productId} status to ${newStatus}`);
      
      const response = await axios.patch(`http://localhost:8082/api/owner/products/${productId}/status`, {
        isActive: newStatus
      });
      
      if (response.data && response.data.Status === 'success') {
        console.log(`Status toggle success: ${response.data.message}`);
        
        // Update product in state to reflect the change
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.ProductID === productId 
              ? { ...p, IsActive: newStatus } 
              : p
          )
        );
        
        // Show success message
        setAlertInfo({
          open: true,
          message: `Product ${newStatus ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
        
        // Also update the product in viewDialog if it's the same product
        if (viewDialog.product && viewDialog.product.ProductID === productId) {
          setViewDialog(prev => ({
            ...prev,
            product: {
              ...prev.product,
              IsActive: newStatus
            }
          }));
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update product status');
      }
    } catch (err) {
      console.error('Error updating product status:', err);
      setAlertInfo({
        open: true,
        message: 'Failed to update product status: ' + (err.message || 'Unknown error'),
        severity: 'error'
      });
    } finally {
      // Close the confirmation dialog
      setConfirmDialog({ 
        open: false, 
        productId: null, 
        productName: '', 
        currentStatus: true,
        title: '',
        message: '',
        action: ''
      });
    }
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Navigate to add product page
  const handleAddProduct = () => {
    navigate('/products/add');
  };

  // Helper to get proper value for stock status filter
  const getStockStatusLabel = (value) => {
    switch (value) {
      case 'true': return 'In Stock';
      case 'false': return 'Out of Stock';
      default: return 'All Stock Status';
    }
  };

  // Helper to get proper value for product status filter
  const getProductStatusLabel = (value) => {
    switch (value) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      default: return 'All Products';
    }
  };

  return (
    <div className="product-list-container">
      <div className="product-list-card">
        <div className="product-list-header">
          <div className="header-title">
            <FaBoxOpen className="header-icon" />
            <h2>Product Management</h2>
          </div>
          
          <button className="add-product-btn" onClick={handleAddProduct}>
            <FaPlusCircle /> Add New Product
          </button>
        </div>

        <div className="search-bar">
          <div className="input-group">
            <FaSearch className="input-icon" />
            <input
              type="text"
              placeholder="Search products by ID, name or description..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="filter-section">
          <h3>
            <FaFilter /> Filter Products
          </h3>
          <div className="filter-options">
            <div className="filter-row">
              <div className="filter-group">
                <label>Primary Category</label>
                <select 
                  name="category1" 
                  value={filters.category1} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Primary Categories</option>
                  {categoryOptions.category1.map((category, index) => (
                    <option key={`cat1-${index}`} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Secondary Category</label>
                <select 
                  name="category2" 
                  value={filters.category2} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Secondary Categories</option>
                  {categoryOptions.category2.map((category, index) => (
                    <option key={`cat2-${index}`} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Tertiary Category</label>
                <select 
                  name="category3" 
                  value={filters.category3} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Tertiary Categories</option>
                  {categoryOptions.category3.map((category, index) => (
                    <option key={`cat3-${index}`} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>Price Range</label>
                <div className="price-range">
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    min="0"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>Stock Status</label>
                <select
                  name="inStock"
                  value={filters.inStock}
                  onChange={handleFilterChange}
                >
                  <option value="">All Stock Status</option>
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Product Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Products</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <button
                className="clear-filters-btn"
                onClick={handleClearFilters}
                disabled={!Object.values(filters).some(val => val !== '') && !searchQuery}
              >
                <FaTimes /> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <CircularProgress />
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <FaExclamationTriangle />
            <p>{error}</p>
            <button onClick={fetchProducts}>Try Again</button>
          </div>
        ) : (
          <>
            <div className="active-filters">
              {searchQuery && (
                <Chip 
                  label={`Search: ${searchQuery}`} 
                  onDelete={() => setSearchQuery('')}
                  className="filter-chip"
                />
              )}
              {filters.category1 && (
                <Chip 
                  label={`Primary Category: ${filters.category1}`} 
                  onDelete={() => setFilters({...filters, category1: ''})}
                  className="filter-chip"
                />
              )}
              {filters.category2 && (
                <Chip 
                  label={`Secondary Category: ${filters.category2}`} 
                  onDelete={() => setFilters({...filters, category2: ''})}
                  className="filter-chip"
                />
              )}
              {filters.category3 && (
                <Chip 
                  label={`Tertiary Category: ${filters.category3}`} 
                  onDelete={() => setFilters({...filters, category3: ''})}
                  className="filter-chip"
                />
              )}
              {filters.minPrice && (
                <Chip 
                  label={`Min Price: ${formatCurrency(filters.minPrice)}`} 
                  onDelete={() => setFilters({...filters, minPrice: ''})}
                  className="filter-chip"
                />
              )}
              {filters.maxPrice && (
                <Chip 
                  label={`Max Price: ${formatCurrency(filters.maxPrice)}`} 
                  onDelete={() => setFilters({...filters, maxPrice: ''})}
                  className="filter-chip"
                />
              )}
              {filters.inStock !== '' && (
                <Chip 
                  label={`Stock: ${getStockStatusLabel(filters.inStock)}`} 
                  onDelete={() => setFilters({...filters, inStock: ''})}
                  className="filter-chip"
                />
              )}
              {filters.status !== '' && (
                <Chip 
                  label={`Status: ${getProductStatusLabel(filters.status)}`} 
                  onDelete={() => setFilters({...filters, status: ''})}
                  className="filter-chip"
                />
              )}
            </div>
            
            <div className="product-table-container">
              <table className="product-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('ProductID')} className="sortable-header">
                      Product ID 
                      {sortConfig.field === 'ProductID' && (
                        sortConfig.order === 'ASC' ? 
                        <FaSortAmountUpAlt className="sort-icon" /> : 
                        <FaSortAmountDownAlt className="sort-icon" />
                      )}
                    </th>
                    <th className="image-column">Image</th>
                    <th onClick={() => handleSort('ProductName')} className="sortable-header">
                      Name
                      {sortConfig.field === 'ProductName' && (
                        sortConfig.order === 'ASC' ? 
                        <FaSortAmountUpAlt className="sort-icon" /> : 
                        <FaSortAmountDownAlt className="sort-icon" />
                      )}
                    </th>
                    <th onClick={() => handleSort('DateAdded')} className="sortable-header">
                      Date Added
                      {sortConfig.field === 'DateAdded' && (
                        sortConfig.order === 'ASC' ? 
                        <FaSortAmountUpAlt className="sort-icon" /> : 
                        <FaSortAmountDownAlt className="sort-icon" />
                      )}
                    </th>
                    <th onClick={() => handleSort('Category1')} className="sortable-header">
                      Category
                      {sortConfig.field === 'Category1' && (
                        sortConfig.order === 'ASC' ? 
                        <FaSortAmountUpAlt className="sort-icon" /> : 
                        <FaSortAmountDownAlt className="sort-icon" />
                      )}
                    </th>
                    <th onClick={() => handleSort('UnitPrice')} className="sortable-header">
                      Price
                      {sortConfig.field === 'UnitPrice' && (
                        sortConfig.order === 'ASC' ? 
                        <FaSortAmountUpAlt className="sort-icon" /> : 
                        <FaSortAmountDownAlt className="sort-icon" />
                      )}
                    </th>
                    <th onClick={() => handleSort('TotalStock')} className="sortable-header">
                      Stock
                      {sortConfig.field === 'TotalStock' && (
                        sortConfig.order === 'ASC' ? 
                        <FaSortAmountUpAlt className="sort-icon" /> : 
                        <FaSortAmountDownAlt className="sort-icon" />
                      )}
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.ProductID} className={!product.IsActive ? 'inactive-product' : ''}>
                        <td>{product.ProductID}</td>
                        <td className="image-column">
                          {product.primaryImage ? (
                            <div className="product-thumbnail">
                              <img 
                                src={`http://localhost:8082/api/owner/products/${product.ProductID}/images/0`}
                                alt={product.ProductName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="product-thumbnail no-image">
                              <FaImage className="no-image-icon" />
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="product-name">
                            <span>{product.ProductName}</span>
                            {product.imageCount > 1 && (
                              <Badge badgeContent={product.imageCount} color="primary" className="image-count-badge">
                                <FaImage className="image-count-icon" />
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>{formatDate(product.DateAdded)}</td>
                        <td>
                          <div className="category-cell">
                            <span className="primary-category">{product.Category1}</span>
                            {product.Category2 && (
                              <Tooltip title={`Secondary: ${product.Category2}`}>
                                <span className="category-count">+1</span>
                              </Tooltip>
                            )}
                            {product.Category3 && (
                              <Tooltip title={`Tertiary: ${product.Category3}`}>
                                <span className="category-count">+1</span>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td>{formatCurrency(product.UnitPrice)}</td>
                        <td className={parseInt(product.TotalStock) > 0 ? 'in-stock' : 'out-of-stock'}>
                          {parseInt(product.TotalStock) > 0 ? 
                            <span><FaBoxes className="stock-icon" /> {product.TotalStock} in stock</span> : 
                            <span><FaBox className="stock-icon" /> Out of stock</span>}
                        </td>
                        <td>
                          <Chip 
                            label={product.IsActive ? 'Active' : 'Inactive'} 
                            color={product.IsActive ? 'success' : 'default'}
                            size="small"
                            className="status-chip"
                          />
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Tooltip title="View details">
                              <button 
                                className="view-btn" 
                                onClick={() => handleViewProduct(product.ProductID)}
                              >
                                <FaEye />
                              </button>
                            </Tooltip>
                            <Tooltip title="Edit product">
                              <button 
                                className="edit-btn" 
                                onClick={() => handleEditProduct(product.ProductID)}
                              >
                                <FaEdit />
                              </button>
                            </Tooltip>
                            <Tooltip title={product.IsActive ? 'Deactivate product' : 'Activate product'}>
                              <button 
                                className={product.IsActive ? "deactivate-btn" : "activate-btn"} 
                                onClick={() => handleToggleStatusConfirm(product)}
                              >
                                {product.IsActive ? <FaToggleOn /> : <FaToggleOff />}
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="no-products">
                        <FaExclamationTriangle />
                        <p>No products found</p>
                        {(Object.values(filters).some(val => val !== '') || searchQuery) && (
                          <button 
                            className="clear-search-btn"
                            onClick={handleClearFilters}
                          >
                            Clear All Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination-container">
                <Pagination 
                  count={pagination.totalPages} 
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                  size="large"
                />
                <div className="pagination-info">
                  Showing {products.length} of {pagination.totalItems} products
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({...confirmDialog, open: false})}
      >
        <DialogTitle>
          <div className="dialog-title">
            {confirmDialog.currentStatus ? 
              <FaToggleOff className="warning-icon" /> : 
              <FaToggleOn className="success-icon" />}
            <span>{confirmDialog.title}</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <p>{confirmDialog.message}</p>
          <p className="dialog-note">
            {confirmDialog.currentStatus ? 
              "Deactivated products are hidden from customers but remain in the database." : 
              "Activating will make this product visible to customers again."}
          </p>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({...confirmDialog, open: false})}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleToggleStatus}
            color={confirmDialog.currentStatus ? "error" : "success"}
            variant="contained"
          >
            {confirmDialog.action}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product View Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({...viewDialog, open: false})}
        maxWidth="lg"
        fullWidth
        className="product-detail-dialog"
      >
        <DialogTitle className="product-detail-header">
          <div className="dialog-title-content">
            <div className="dialog-title-left">
              <FaInfoCircle className="title-icon" />
              <span>Product Details</span>
            </div>
            <IconButton 
              onClick={() => setViewDialog({...viewDialog, open: false})}
              className="close-button"
              size="large"
            >
              <FaTimes />
            </IconButton>
          </div>
        </DialogTitle>
        
        <DialogContent dividers className="product-detail-content">
          {viewDialog.loading ? (
            <div className="loading-container">
              <CircularProgress size={60} />
              <p>Loading product details...</p>
            </div>
          ) : viewDialog.error ? (
            <div className="error-container">
              <FaExclamationTriangle size={48} className="error-icon" />
              <p className="error-message">{viewDialog.error}</p>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleViewProduct(viewDialog.productId)}
                startIcon={<FaSync />}
              >
                Try Again
              </Button>
            </div>
          ) : viewDialog.product ? (
            <div className="product-details">
              {/* Product Header with Name, ID and Status */}
              <div className="product-details-header">
                <div className="product-title-section">
                  <h2 className="product-title">{viewDialog.product.ProductName}</h2>
                  <div className="product-status-section">
                    <Chip 
                      label={viewDialog.product.TotalStock > 0 ? 'In Stock' : 'Out of Stock'} 
                      color={viewDialog.product.TotalStock > 0 ? 'success' : 'error'}
                      variant="outlined"
                      size="small"
                      className="status-chip"
                    />
                    <Chip 
                      label={viewDialog.product.IsActive ? 'Active' : 'Inactive'} 
                      color={viewDialog.product.IsActive ? 'success' : 'default'}
                      variant="outlined"
                      size="small"
                      className="status-chip"
                    />
                    <div className="product-id-tag">
                      <span>ID: {viewDialog.product.ProductID}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Content Area */}
              <div className="product-details-body">
                {/* Left Column: Images and Description */}
                <div className="product-details-left">
                  {/* Product Images Gallery */}
                  <div className="product-images-section">
                    <h3 className="section-title">Product Images</h3>
                    
                    <div className="product-images">
                      {viewDialog.product.images && viewDialog.product.images.length > 0 ? (
                        <div className="product-images-grid">
                          {viewDialog.product.images.map((image, index) => (
                            <div 
                              key={index} 
                              className={`product-image-card ${image.is_primary ? 'primary-image' : ''}`}
                            >
                              <div className="image-container">
                                <img 
                                  src={image.image_url} 
                                  alt={`${viewDialog.product.ProductName} - ${index + 1}`} 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5OTkiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                                  }}
                                />
                              </div>
                              {image.is_primary && (
                                <span className="primary-badge">
                                  <FaStar /> Primary
                                </span>
                              )}
                              <span className="image-number">Image {index + 1}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-images-container">
                          <FaImage className="no-images-icon" />
                          <p>No images available for this product</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Product Description */}
                  <div className="product-description-section">
                    <h3 className="section-title">Description</h3>
                    <div className="description-content">
                      {viewDialog.product.ProductDescription ? (
                        <p>{viewDialog.product.ProductDescription}</p>
                      ) : (
                        <p className="no-content">No description provided for this product</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Column: Details and Variations */}
                <div className="product-details-right">
                  {/* Price and Date Info */}
                  <div className="detail-section price-section">
                    <div className="detail-row">
                      <div className="detail-label">Price:</div>
                      <div className="detail-value highlight-value">
                        {formatCurrency(viewDialog.product.UnitPrice)}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Added On:</div>
                      <div className="detail-value">
                        {formatDate(viewDialog.product.DateAdded)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Categories */}
                  <div className="detail-section">
                    <h3 className="section-title">Categories</h3>
                    <div className="categories-container">
                      <div className="category-pill primary">
                        <span className="category-label">Primary:</span>
                        <span className="category-value">{viewDialog.product.Category1}</span>
                      </div>
                      
                      {viewDialog.product.Category2 && (
                        <div className="category-pill secondary">
                          <span className="category-label">Secondary:</span>
                          <span className="category-value">{viewDialog.product.Category2}</span>
                        </div>
                      )}
                      
                      {viewDialog.product.Category3 && (
                        <div className="category-pill tertiary">
                          <span className="category-label">Tertiary:</span>
                          <span className="category-value">{viewDialog.product.Category3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div className="detail-section">
                    <h3 className="section-title">Product Information</h3>
                    <div className="details-grid">
                      <div className="detail-row">
                        <div className="detail-label">Material:</div>
                        <div className="detail-value">
                          {viewDialog.product.Material || 'Not specified'}
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-label">Fabric Type:</div>
                        <div className="detail-value">
                          {viewDialog.product.FabricType || 'Not specified'}
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-label">Return Policy:</div>
                        <div className="detail-value">
                          {viewDialog.product.ReturnPolicy || 'Not specified'}
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-label">Shipping Weight:</div>
                        <div className="detail-value">
                          {viewDialog.product.ShippingWeight ? `${viewDialog.product.ShippingWeight} kg` : 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Variations */}
                  <div className="detail-section variations-section">
                    <h3 className="section-title">Available Variations</h3>
                    {viewDialog.product.variations && viewDialog.product.variations.length > 0 ? (
                      <div className="variations-table-container">
                        <table className="variations-table">
                          <thead>
                            <tr>
                              <th>Size</th>
                              <th>Color</th>
                              <th>Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewDialog.product.variations.map((variation, index) => (
                              <tr key={index}>
                                <td>{variation.SizeValue}</td>
                                <td>
                                  <div className="color-sample">
                                    <span 
                                      className="color-dot" 
                                      style={{ 
                                        backgroundColor: isValidColor(variation.ColorValue) ? 
                                          variation.ColorValue : '#cccccc' 
                                      }}
                                    ></span>
                                    {variation.ColorValue}
                                  </div>
                                </td>
                                <td className={variation.units > 0 ? 'in-stock' : 'out-of-stock'}>
                                  {variation.units > 0 ? (
                                    <span className="stock-available">
                                      <FaCheck className="stock-icon" /> {variation.units} available
                                    </span>
                                  ) : (
                                    <span className="stock-empty">
                                      <FaTimes className="stock-icon" /> Out of stock
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="no-content">No variations available for this product</p>
                    )}
                  </div>
                  
                  {/* Statistics */}
                  <div className="detail-section stats-section">
                    <h3 className="section-title">Performance Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-icon wishlist-icon">
                          <FaHeart />
                        </div>
                        <div className="stat-details">
                          <span className="stat-value">{viewDialog.product.WishlistCount || 0}</span>
                          <span className="stat-label">Wishlist Adds</span>
                        </div>
                      </div>
                      
                      <div className="stat-item">
                        <div className="stat-icon rating-icon">
                          <FaStar />
                        </div>
                        <div className="stat-details">
                          <span className="stat-value">
                            {viewDialog.product.FinalRating ? 
                              <>{viewDialog.product.FinalRating}<span className="stat-unit">/5.0</span></> : 
                              'N/A'}
                          </span>
                          <span className="stat-label">Average Rating</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-product-container">
              <FaBoxOpen className="no-product-icon" />
              <p>No product selected</p>
            </div>
          )}
        </DialogContent>
        
        <DialogActions className="product-detail-actions">
          {viewDialog.product && (
            <>
              <Button 
                onClick={() => handleEditProduct(viewDialog.product.ProductID)}
                variant="contained"
                color="primary"
                startIcon={<FaEdit />}
                className="action-button edit-button"
              >
                Edit Product
              </Button>
              <Button 
                onClick={() => {
                  setViewDialog({...viewDialog, open: false});
                  handleToggleStatusConfirm(viewDialog.product);
                }}
                variant="outlined"
                color={viewDialog.product.IsActive ? "error" : "success"}
                startIcon={viewDialog.product.IsActive ? <FaToggleOff /> : <FaToggleOn />}
                className="action-button toggle-button"
              >
                {viewDialog.product.IsActive ? 'Deactivate' : 'Activate'}
              </Button>
            </>
          )}
          <Button 
            onClick={() => setViewDialog({...viewDialog, open: false})}
            color="inherit"
            className="action-button close-button"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for alerts */}
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({...alertInfo, open: false})}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlertInfo({...alertInfo, open: false})}
          severity={alertInfo.severity}
          variant="filled"
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

// Helper function to check if a string is a valid CSS color
const isValidColor = (color) => {
  const testElement = document.createElement('div');
  testElement.style.color = color;
  return testElement.style.color !== '';
};

const AuthenticatedProductList = withAuth(ProductList);
export default AuthenticatedProductList;
