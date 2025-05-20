//Pages/Products/AddProducts.jsx

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddProducts.css';
import withAuth from '../withAuth';
import { 
  FaBox, FaTag, FaList, FaInfoCircle, FaWeightHanging, FaPlus, FaCalendar, FaTshirt, 
  FaPalette, FaBalanceScale, FaVenusMars, FaStar, FaHeart, FaMinus,
  FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import {productValidationSchema} from '../inputValidations';

const categories = {
  "WOMEN": {
    "Tops & Tees": ["Blouses", "Crop Tops", "T-Shirts", "Hoodies & Sweaters"],
    "Dresses & Bottoms": ["Dresses & Frocks", "Skirts", "Trousers", "Denims", "Shorts", "Pants"],
    "Special Categories": ["Jumpsuits", "Bodysuits", "Office Wear", "Gym Wear", "Night & Loungewear"]
  },
  "MEN": {
    "Tops": ["Shirts", "T-Shirts", "Hoodies & Sweaters"],
    "Bottoms": ["Trousers", "Denims", "Shorts", "Pants"],
    "Special Categories": ["Office Wear", "Gym Wear"]
  },
  "KIDS & BABY": {
    "Boys' Clothing (3-16)": [],
    "Girls' Clothing (3-16)": [],
    "Baby Clothing": [],
    "Kids' Footwear": [],
    "Bags & Accessories": ["Kids' Bags", "Kids' Watches", "Hats & Caps"],
  },
  "WATCHES": {
    "Men's Watches": [],
    "Women's Watches": [],
  },
  "FOOTWEAR": {
    "Women's Footwear": [],
    "Men's Footwear": [],
  },
  "ACCESSORIES": {
    "Bags & Backpacks": ["Handbags", "Backpacks", "Travel Bags"],
    "Belts": [],
    "Wallets": [],
    "Headwear": ["Caps", "Ice Caps", "Hats", "Beanies"],
    "Jewelry": ["Necklaces", "Bracelets", "Earrings"],
    "Perfumes & Fragrances": [],
    "Wallets & Cardholders": [],
    "Tie Pins & Cufflinks": []
  },
  "SALE & OFFERS": {
    "Best Deals": [],
    "Clearance Sale": [],
    "Limited-Time Discounts": []
  }
};

const AddProducts = ({ isEditMode }) => {
  const { productId } = useParams();
  const navigate = useNavigate(); // Make sure this is here
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [optionsCategory2, setOptionsCategory2] = useState([]);
  const [optionsCategory3, setOptionsCategory3] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [errors, setErrors] = useState({});
  const [alertSeverity, setAlertSeverity] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [initialImageUrls, setInitialImageUrls] = useState([]);
  const [deletedImageIndices, setDeletedImageIndices] = useState([]);

  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    product_description: '',
    unit_price: '',
    date_added: '',
    shipping_weight: '',
    total_units: '',
    category1: '',
    category2: '',
    category3: '',
    material: '',
    fabric_type: '',
    return_policy: '',
    product_variations: [{ size: '', color: '', units: '' }],
    isActive: true
  });

  const styles = {
    inputGroup: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    inputIcon: {
      position: 'absolute',
      left: '15px',
      color: '#23b893',
      fontSize: '16px',
      width: '20px',
      textAlign: 'center',
      zIndex: 1,
      pointerEvents: 'none',
      backgroundColor: 'transparent',
    },
    input: {
      width: '100%',
      padding: '12px 15px 12px 50px', // Increased left padding
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#333',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8f9fa',
      lineHeight: 1.5,
    },
    select: {
      width: '100%',
      padding: '12px 15px 12px 50px', 
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#333',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8f9fa',
      lineHeight: 1.5,
      appearance: 'auto', // Ensure dropdown arrow appears
    },
    textarea: {
      width: '100%',
      padding: '12px 15px 12px 50px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#333',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8f9fa',
      minHeight: '100px',
      resize: 'vertical',
      lineHeight: 1.5,
    },
    idInput: {
      width: '100%',
      padding: '12px 15px 12px 50px',
      paddingRight: '95px', // Space for the generate button
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#333',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8f9fa',
      lineHeight: 1.5,
    },
    generateBtn: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#23b893',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '0.8rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      zIndex: 2,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    errorMessage: {
      color: '#e74c3c',
      fontSize: '12px',
      marginTop: '4px',
      display: 'block',
    }
  };

//---------------------------------------------------------------------------------------------------------------------------  
  // Handle Category Changes
  const handleChangeCategory1 = (e) => {
    const selectedCategory1 = e.target.value;
    setFormData(prevState => ({ ...prevState, category1: selectedCategory1 }));
    const subCategories = Object.keys(categories[selectedCategory1]);
    setOptionsCategory2(subCategories);
    setOptionsCategory3([]);
    setFormData(prevState => ({ ...prevState, category2: '', category3: '' }));
  };

  const handleChangeCategory2 = (e) => {
    const selectedCategory2 = e.target.value;
    setFormData(prevState => ({ ...prevState, category2: selectedCategory2 }));
    const subSubCategories = categories[formData.category1][selectedCategory2];
    setOptionsCategory3(subSubCategories);
    setFormData(prevState => ({ ...prevState, category3: '' }));
  };

  const handleChangeCategory3 = (e) => {
    setFormData(prevState => ({ ...prevState, category3: e.target.value }));
  };
  
  // Image handling functions
  const handleImageChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const newImageFiles = [...imageFiles];
      const newImageUrls = [...uploadedImages];
      
      Array.from(files).forEach(file => {
        file.isExisting = false;
        newImageFiles.push(file);
        newImageUrls.push(URL.createObjectURL(file));
      });
      
      if (newImageUrls.length > 10) {
        alert("You can upload up to 10 images.");
        return;
      }
      
      setImageFiles(newImageFiles);
      setUploadedImages(newImageUrls);
      
      console.log(`Added ${files.length} new files. Total: ${newImageFiles.length}`);
    }
  };
  
  const handleRemoveImage = (index) => {
    const updatedImages = [...uploadedImages];
    const updatedImageFiles = [...imageFiles];
    
    URL.revokeObjectURL(uploadedImages[index]);
    
    if (isEditMode && initialImageUrls[index] && initialImageUrls[index].isExisting) {
      setDeletedImageIndices([...deletedImageIndices, initialImageUrls[index].index]);
    }
    
    updatedImages.splice(index, 1);
    updatedImageFiles.splice(index, 1);
    
    setUploadedImages(updatedImages);
    setImageFiles(updatedImageFiles);
  };
  
  // Variations handling
  const calculateTotalUnits = (variations) => {
    return variations.reduce((total, variation) => total + (Number(variation.units) || 0), 0);
  };
  
  useEffect(() => {
    const totalUnits = calculateTotalUnits(formData.product_variations);
    setFormData(prevState => ({
      ...prevState,
      total_units: totalUnits,
    }));
  }, [formData.product_variations]);
  
  const handleVariationChange = (index, e) => {
    const { name, value } = e.target;
    
    const updatedVariations = [...formData.product_variations];
    updatedVariations[index][name] = value;
    
    setFormData((prevState) => ({
      ...prevState,
      product_variations: updatedVariations,
    }));
  };
  
  const addVariation = () => {
    const updatedVariations = [...formData.product_variations, { size: '', color: '', units: '' }];
    
    const totalUnits = calculateTotalUnits(updatedVariations);
    setFormData(prevState => ({
      ...prevState,
      product_variations: updatedVariations,
      total_units: totalUnits,
    }));
  };
  
  const removeVariation = (indexToRemove) => {
    if (formData.product_variations.length > 1) {
      const updatedVariations = formData.product_variations.filter((_, index) => index !== indexToRemove);
      
      const totalUnits = calculateTotalUnits(updatedVariations);
      setFormData(prevState => ({
        ...prevState,
        product_variations: updatedVariations,
        total_units: totalUnits,
      }));
    }
  };
  
  // Fetch sizes and colors
  useEffect(() => {
    const fetchSizesAndColors = async () => {
      try {
        const sizesResponse = await axios.get('http://localhost:8082/api/owner/fetch-sizes');
        const colorsResponse = await axios.get('http://localhost:8082/api/owner/fetch-colors');
        
        console.log('Sizes:', sizesResponse.data);
        console.log('Colors:', colorsResponse.data);
        
        setSizes(sizesResponse.data);
        setColors(colorsResponse.data);
      } catch (error) {
        console.error('Error fetching sizes and colors:', error);
      }
    };
    
    fetchSizesAndColors();
  }, []);
  
  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    productValidationSchema
      .validate(formData, { abortEarly: false })
      .then(() => {
        const formDataToSend = new FormData();
        
        Object.keys(formData).forEach(key => {
          if (key !== 'product_variations') {
            formDataToSend.append(key, formData[key]);
          }
        });
        
        formDataToSend.append('product_variations', JSON.stringify(formData.product_variations));
        
        if (isEditMode && deletedImageIndices.length > 0) {
          formDataToSend.append('deletedImageIndices', JSON.stringify(deletedImageIndices));
        }
        
        if (imageFiles && imageFiles.length > 0) {
          for (let i = 0; i < imageFiles.length; i++) {
            if (!imageFiles[i].isExisting) {
              formDataToSend.append('images', imageFiles[i]);
            }
          }
        }
        
        const endpoint = isEditMode 
          ? `http://localhost:8082/api/owner/products/${productId}/update` 
          : 'http://localhost:8082/api/owner/owner-add-product';
        
        axios.post(endpoint, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
          .then(res => {
            if (res.data && res.data.Status === "success") {
              setAlertSeverity("success");
              setMessage(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
              setOpen(true);
              
              if (!isEditMode) {
                resetForm();
              }
            } else {
              throw new Error(res.data?.message || 'Operation failed');
            }
          })
          .catch(err => {
            console.error('Error:', err);
            setAlertSeverity('error');
            setMessage(err.response?.data?.message || 'Server error. Please try again.');
            setOpen(true);
          });
      })
      .catch(err => {
        const validationErrors = {};
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      });
  };
  
  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Fetch product details for edit mode
  useEffect(() => {
    if (isEditMode && productId) {
      fetchProductDetails();
    }
  }, [isEditMode, productId]);
  
  const fetchProductDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8082/api/owner/products/${productId}`);
      
      if (response.data && response.data.Status === 'success') {
        const productData = response.data.product;
        
        if (productData.images && productData.images.length > 0) {
          const formattedImages = productData.images.map(img => ({
            url: `http://localhost:8082${img.image_url}`,
            index: img.index,
            isExisting: true
          }));
          
          setInitialImageUrls(formattedImages);
          setUploadedImages(formattedImages.map(img => img.url));
          setImageFiles(formattedImages.map(img => ({
            isExisting: true
          })));
        }
        
        const formattedVariations = productData.variations.map(variation => ({
          id: variation.VariationID,
          size: variation.SizeValue,
          color: variation.ColorValue,
          units: variation.units,
          isExisting: true
        }));
        
        setFormData({
          product_id: productData.ProductID,
          product_name: productData.ProductName,
          product_description: productData.ProductDescription || '',
          unit_price: productData.UnitPrice,
          date_added: formatDateForInput(productData.DateAdded),
          shipping_weight: productData.ShippingWeight || '',
          total_units: productData.TotalStock || 0,
          category1: productData.Category1,
          category2: productData.Category2 || '',
          category3: productData.Category3 || '',
          material: productData.Material || '',
          fabric_type: productData.FabricType || '',
          return_policy: productData.ReturnPolicy || '',
          product_variations: formattedVariations.length > 0 ? formattedVariations : [{ size: '', color: '', units: '' }],
          isActive: productData.IsActive
        });
        
        if (productData.Category1) {
          setOptionsCategory2(Object.keys(categories[productData.Category1] || {}));
          
          if (productData.Category2) {
            setOptionsCategory3(categories[productData.Category1][productData.Category2] || []);
          }
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch product details');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setAlertSeverity('error');
      setMessage(`Error loading product: ${err.message}`);
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date helper
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Reset form function
  const resetForm = () => {
    setFormData({
      product_id: '',
      product_name: '',
      product_description: '',
      unit_price: '',
      date_added: '',
      shipping_weight: '',
      total_units: 0,
      category1: '',
      category2: '',
      category3: '',
      material: '',
      fabric_type: '',
      return_policy: '',
      product_variations: [{ size: '', color: '', units: '' }],
      isActive: true
    });
    setUploadedImages([]);
    setImageFiles([]);
    setDeletedImageIndices([]);
    setInitialImageUrls([]);
  };
  
  // Navigation after success
  useEffect(() => {
    if (open && alertSeverity === 'success' && message) {
      if (message.includes('successfully')) {
        const timer = setTimeout(() => {
          navigate('/products');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [open, alertSeverity, message, navigate]);
  
  // Function to generate a unique product ID
  const generateProductId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2); // Get last 2 digits of year
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Generate random alphanumeric part
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const productId = `PRD-${year}${month}${day}-${randomPart}`;
    
    setFormData(prevState => ({
      ...prevState,
      product_id: productId
    }));
  };
  
  // Component render
  return (
    <>
      <div className="add-product-container">
        <div className="add-product-card">
          <h2>{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
          
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading product data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Availability Status, Wishlist Count, Final Rating */}
              <div className="form-row display-row">
                <div className="form-group">
                  <label>Availability Status</label>
                  <div className="display-field">
                    <FaBox className="input-icon" />
                    <span>{formData.availability_status}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Wishlist Count</label>
                  <div className="display-field">
                    <FaHeart className="input-icon" />
                    <span>{formData.wishlist_count}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Final Rating</label>
                  <div className="display-field">
                    <FaStar className="input-icon" />
                    <span>{formData.final_rating}</span>
                  </div>
                </div>
              </div>

              {/* Product ID and Name */}
              <div className="form-row">
                <div className="form-group">
                  <label>Product ID</label>
                  <div className="input-group">
                    <FaTag className="input-icon" />
                    <input
                      type="text"
                      name="product_id"
                      placeholder="Enter product ID"
                      value={formData.product_id}
                      onChange={handleChange}
                      readOnly={isEditMode}
                      required
                      style={{
                        paddingRight: isEditMode ? '12px' : '85px' // Add space for the button
                      }}
                    />
                    {!isEditMode && (
                      <button
                        type="button"
                        className="id-generate-btn"
                        onClick={generateProductId}
                        title="Generate Product ID"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                  {errors.product_id && <span className="error-message">{errors.product_id}</span>}
                </div>
                <div className="form-group">
                  <label>Product Name</label>
                  <div className="input-group">
                    <FaBox className="input-icon" />
                    <input
                      type="text"
                      name="product_name"
                      placeholder="Enter product name"
                      value={formData.product_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.product_name && <span className="error-message">{errors.product_name}</span>}
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="image-upload-section">
                <label>Upload Product Images (Up to 10)</label>
                <div className="image-upload-wrapper">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="uploaded-image-preview-container">
                      <img src={image} alt="Uploaded Preview" className="uploaded-image-preview" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {uploadedImages.length < 10 && (
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="image-upload-input"
                    />
                  )}
                </div>
              </div>

              {/* Product Description */}
              <div className="form-row">
                <div className="form-group">
                  <label>Product Description</label>
                  <div className="input-group">
                    <FaInfoCircle className="input-icon" />
                    <textarea
                      name="product_description"
                      placeholder="Enter product description"
                      value={formData.product_description}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.product_description && <span className="error-message">{errors.product_description}</span>}
                </div>
              </div>

              {/* Unit Price, Date Added, Shipping Weight */}
              <div className="form-row">
                <div className="form-group">
                  <label>Unit Price</label>
                  <div className="input-group">
                    <FaTag className="input-icon" />
                    <input
                      type="number"
                      name="unit_price"
                      placeholder="Enter unit price"
                      value={formData.unit_price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.unit_price && <span className="error-message">{errors.unit_price}</span>}
                </div>
                <div className="form-group">
                  <label>Date Added</label>
                  <div className="input-group">
                    <FaCalendar className="input-icon" />
                    <input
                      type="date"
                      name="date_added"
                      value={formData.date_added}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.date_added && <span className="error-message">{errors.date_added}</span>}
                </div>
                <div className="form-group">
                  <label>Shipping Weight</label>
                  <div className="input-group">
                    <FaWeightHanging className="input-icon" />
                    <input
                      type="number"
                      name="shipping_weight"
                      placeholder="Enter shipping weight (KG)"
                      value={formData.shipping_weight}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.shipping_weight && <span className="error-message">{errors.shipping_weight}</span>}
                </div>
              </div>

              {/* Product Variations */}
              <div className="variations-container">
                <label>Product Variations</label>
                <div className="variations-wrapper">
                  {formData.product_variations.map((variation, index) => (
                    <div className="variation-row" key={index}>
                      <div className="form-group">
                        <label>Size</label>
                        <div className="input-group">
                          <FaTshirt className="input-icon" />
                          <select
                            name="size"
                            value={variation.size}
                            onChange={(e) => handleVariationChange(index, e)}
                          >
                            <option value="">Select Size</option>
                            {sizes.map((size) => (
                              <option key={size.SizeID} value={size.SizeValue}>
                                {size.SizeValue}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Color</label>
                        <div className="input-group">
                          <FaPalette className="input-icon" />
                          <select
                            name="color"
                            value={variation.color}
                            onChange={(e) => handleVariationChange(index, e)}
                          >
                            <option value="">Select Color</option>
                            {colors.map((color) => (
                              <option key={color.ColorID} value={color.ColorValue}>
                                {color.ColorValue}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Units</label>
                        <div className="input-group">
                          <FaBalanceScale className="input-icon" />
                          <input
                            type="number"
                            name="units"
                            placeholder="Enter units"
                            value={variation.units}
                            onChange={(e) => handleVariationChange(index, e)}
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="remove-variation-btn"
                        onClick={() => removeVariation(index)}
                        disabled={formData.product_variations.length === 1}
                      >
                        <FaMinus />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="add-variation-btn" onClick={addVariation}>
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Total Units */}
              <div className="form-row">
                <div className="form-group">
                  <label>Total Units</label>
                  <div className="input-group">
                    <FaBalanceScale className="input-icon" />
                    <input
                      type="number"
                      name="total_units"
                      placeholder="Enter total units"
                      value={formData.total_units}
                      onChange={handleChange}
                      readOnly 
                    />
                  </div>
                </div>
              </div>

              {/* Category selection Section */}
              <div className="form-row">
                <div className="form-group">
                  <label>Category 1</label>
                  <div className="input-group">
                    <FaList className="input-icon" />
                    <select
                      name="category1"
                      value={formData.category1}
                      onChange={handleChangeCategory1}
                      required
                    >
                      <option value="">Select Category 1</option>
                      {Object.keys(categories).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  {errors.category1 && <span className="error-message">{errors.category1}</span>}
                </div>
                <div className="form-group">
                  <label>Category 2</label>
                  <div className="input-group">
                    <FaList className="input-icon" />
                    <select
                      name="category2"
                      value={formData.category2}
                      onChange={handleChangeCategory2}
                      disabled={!formData.category1}
                    >
                      <option value="">Select Category 2</option>
                      {optionsCategory2.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Category 3</label>
                  <div className="input-group">
                    <FaList className="input-icon" />
                    <select
                      name="category3"
                      value={formData.category3}
                      onChange={handleChangeCategory3}
                      disabled={!formData.category2}
                    >
                      <option value="">Select Category 3</option>
                      {optionsCategory3.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Material and Fabric Type */}
              <div className="form-row">
                <div className="form-group">
                  <label>Material</label>
                  <div className="input-group">
                    <FaTshirt className="input-icon" />
                    <select
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                    >
                      <option value="">Select Material</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Silk">Silk</option>
                      <option value="Linen">Linen</option>
                      <option value="Polyester">Polyester</option>
                      <option value="Wool">Wool</option>
                      <option value="Denim">Denim</option>
                      <option value="Leather">Leather</option>
                    </select>
                  </div>
                </div>

                {/* Fabric Type Selection */}
                <div className="form-group">
                  <label>Fabric Type</label>
                  <div className="input-group">
                    <FaTshirt className="input-icon" />
                    <select
                      name="fabric_type"
                      value={formData.fabric_type}
                      onChange={handleChange}
                    >
                      <option value="">Select Fabric Type</option>
                      <option value="Twill">Twill</option>
                      <option value="Satin">Satin</option>
                      <option value="Jersey">Jersey</option>
                      <option value="Ribbed">Ribbed</option>
                      <option value="Chiffon">Chiffon</option>
                      <option value="Velvet">Velvet</option>
                      <option value="Canvas">Canvas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Return Policy */}
              <div className="form-row">
                <div className="form-group">
                  <label>Return Policy</label>
                  <div className="input-group">
                    <FaInfoCircle className="input-icon" />
                    <textarea
                      name="return_policy"
                      placeholder="Enter return policy"
                      value={formData.return_policy}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="form-row">
                <div className="form-group">
                  <label>Product Status</label>
                  <div className="status-toggle-container">
                    <div className={`status-toggle ${formData.isActive ? 'active' : 'inactive'}`}>
                      <input
                        type="checkbox"
                        id="status-toggle"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      />
                      <label htmlFor="status-toggle" className="toggle-label">
                        <span className="toggle-inner"></span>
                        <span className="toggle-switch"></span>
                      </label>
                    </div>
                    <div className="status-label">
                      {formData.isActive 
                        ? <span className="active-status"><FaToggleOn /> Active</span> 
                        : <span className="inactive-status"><FaToggleOff /> Inactive</span>}
                    </div>
                  </div>
                  <p className="status-help-text">
                    {formData.isActive 
                      ? "Product will be visible to customers" 
                      : "Product will be hidden from customers"}
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => navigate('/products')}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {open && (
        <div className={`alert-overlay ${alertSeverity}`}>
          <div className="alert-message">
            <div className={`alert-icon ${alertSeverity}`}>
              {alertSeverity === 'success' ? '✓' : '⚠'}
            </div>
            <p>{message}</p>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

const AuthenticatedAddProducts = withAuth(AddProducts);
export default AuthenticatedAddProducts;
