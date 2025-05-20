/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import * as Yup from 'yup';
import React, { useState, useEffect } from 'react';
import './AddExpenses.css';
import { 
  FaCalendar, 
  FaTag, 
  FaInfoCircle, 
  FaMoneyBillAlt, 
  FaTimes, 
  FaFileAlt, 
  FaFileUpload,
  FaIdCard,
  FaSync,
  FaEdit,
  FaArrowLeft
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import withAuth from '../withAuth';
import { addExpensesValidationSchema } from '../inputValidations';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// Define inline styles to avoid class conflicts
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
    zIndex: 2,
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
  idInput: {
    width: '100%',
    padding: '12px 15px 12px 50px',
    paddingRight: '45px', // Extra space for generate button
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8f9fa',
    lineHeight: 1.5,
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
  },
  generateBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#23b893',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    zIndex: 2,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
  }
};

const AddExpenses = () => {
  const { id } = useParams(); // Get expense ID from URL if in edit mode
  const isEditMode = !!id; // Check if we're in edit mode
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date as default
    expense_custom_id: '',
    expenses_name: '',
    cost: '',
    description: '',
  });

  const [originalExpense, setOriginalExpense] = useState(null); // Store original expense data
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreview, setFilePreview] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]); // For edit mode: existing files
  const [removedFileIndices, setRemovedFileIndices] = useState([]); // Track removed file indices
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode); // Loading state when fetching existing expense
  const [errors, setErrors] = useState({});
  const [alertSeverity, setAlertSeverity] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Function to generate a custom ID
  const generateCustomId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2); // Get last 2 digits of year
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const suggestedId = `EXP-${year}${month}${day}-${randomPart}`;
    
    setFormData(prevState => ({
      ...prevState,
      expense_custom_id: suggestedId
    }));
  };

  // Fetch existing expense data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchExpenseData();
      loadExistingFiles();
    } else {
      // Generate ID for new expense
      generateCustomId();
    }
  }, [isEditMode]); // Changed from [id] to [isEditMode]

  // Function to fetch expense data for editing
  const fetchExpenseData = async () => {
    setInitialLoading(true);
    try {
      const response = await axios.get(`http://localhost:8082/api/owner/expenses/${id}`);
      
      if (response.data && response.data.Status === 'success') {
        const expenseData = response.data.expense;
        setOriginalExpense(expenseData);
        
        setFormData({
          date: expenseData.date,
          expense_custom_id: expenseData.expense_custom_id,
          expenses_name: expenseData.expenses_name,
          cost: expenseData.cost,
          description: expenseData.description || '',
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch expense data');
      }
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setAlertSeverity('error');
      setMessage('Failed to load expense data. Please try again.');
      setOpen(true);
      
      // Navigate back after error
      setTimeout(() => {
        navigate('/expenses/list');
      }, 3000);
    } finally {
      setInitialLoading(false);
    }
  };

  // Function to load existing files for the expense
  const loadExistingFiles = async () => {
    if (!id) return;
    
    try {
      const response = await axios.get(`http://localhost:8082/api/owner/expenses/${id}/files`);
      
      if (response.data && response.data.Status === 'success') {
        // Map the files to include their index in the backend array
        const filesWithIndex = (response.data.files || []).map((file, index) => ({
          ...file,
          fileIndex: index, // Store the original index to use when removing
          file_url: file.file_url.startsWith('http') 
            ? file.file_url 
            : `http://localhost:8082${file.file_url}`
        }));
        
        setExistingFiles(filesWithIndex);
      }
    } catch (error) {
      console.error('Error loading existing files:', error);
      setAlertSeverity('warning');
      setMessage('Could not load attached files');
      setOpen(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total file count (existing + new shouldn't exceed 2)
    if (existingFiles.length + selectedFiles.length + files.length > 2) {
      setAlertSeverity('warning');
      setMessage(`Maximum 2 files allowed. You already have ${existingFiles.length + selectedFiles.length} file(s).`);
      setOpen(true);
      return;
    }
    
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setAlertSeverity('error');
      setMessage(`Some files are not allowed. Only images and PDF files are accepted.`);
      setOpen(true);
      return;
    }
    
    // Add new files to existing selection
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    
    // Create preview URLs for images
    const newPreviews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return { 
          url: URL.createObjectURL(file),
          type: 'image',
          name: file.name
        };
      } else {
        // For PDF files
        return { 
          url: null,
          type: 'pdf',
          name: file.name
        };
      }
    });
    
    setFilePreview(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  const removeFile = (index) => {
    // Remove file from both arrays
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    
    // Revoke object URL to avoid memory leaks
    if (filePreview[index].url) {
      URL.revokeObjectURL(filePreview[index].url);
    }
    
    setFilePreview(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  // Handle removing an existing file
  const handleRemoveExistingFile = (index) => {
    // Keep track of the actual index in the backend
    if (existingFiles[index]?.fileIndex !== undefined) {
      setRemovedFileIndices(prev => [...prev, existingFiles[index].fileIndex]);
    } else {
      // If no fileIndex property, use the array index itself
      setRemovedFileIndices(prev => [...prev, index]);
    }
    
    // Remove from UI
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    // Clean up any created object URLs
    filePreview.forEach(preview => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    });
    
    // Navigate back to expense list
    navigate('/expenses/list');
  };

  // Validate custom ID when focus leaves the field
  const handleCustomIdBlur = async () => {
    // Skip validation if field is empty or unchanged in edit mode
    if (!formData.expense_custom_id || (isEditMode && formData.expense_custom_id === originalExpense?.expense_custom_id)) {
      return;
    }
    
    try {
      const response = await axios.get(`http://localhost:8082/api/owner/check-expense-id/${formData.expense_custom_id}`);
      
      if (response.data.exists) {
        setErrors(prev => ({
          ...prev,
          expense_custom_id: 'This ID is already in use. Please use a different ID.'
        }));
      } else {
        // Clear error if ID is available
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.expense_custom_id;
          return newErrors;
        });
      }
    } catch (err) {
      console.error('Error checking custom ID:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form data
    try {
      // Extend validation schema to include custom ID
      const validationSchema = addExpensesValidationSchema.shape({
        expense_custom_id: Yup.string().required('Custom ID is required')
      });
      
      await validationSchema.validate(formData, { abortEarly: false });
      
      // Check if custom ID already exists
      if (errors.expense_custom_id) {
        setAlertSeverity('error');
        setMessage('Please fix the errors before submitting.');
        setOpen(true);
        return;
      }
      
      setLoading(true);
      
      // Create FormData object for multipart/form-data submission
      const submitData = new FormData();
      
      // Add expense details to FormData
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      // Add files to FormData
      selectedFiles.forEach(file => {
        submitData.append('files', file);
      });
      
      // Add info about removed existing files if in edit mode
      if (isEditMode && removedFileIndices.length > 0) {
        submitData.append('removedFiles', JSON.stringify(removedFileIndices));
      }
      
      let response;
      
      // Either update or create expense based on mode
      if (isEditMode) {
        response = await axios.put(
          `http://localhost:8082/api/owner/expenses/${id}`,
          submitData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        response = await axios.post(
          'http://localhost:8082/api/owner/expenses', // Updated endpoint for consistency
          submitData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }
      
      if (response.data && (response.data.Status === 'Success' || response.data.Status === 'success')) {
        console.log(`Expense ${isEditMode ? 'updated' : 'added'} successfully:`, response.data);
        
        // Clean up file previews
        filePreview.forEach(preview => {
          if (preview.url) URL.revokeObjectURL(preview.url);
        });
        
        // Show success message
        setAlertSeverity('success');
        setMessage(response.data.message || `Expense ${isEditMode ? 'updated' : 'added'} successfully!`);
        setOpen(true);
        
        // Navigate back to expense list after success
        setTimeout(() => {
          navigate('/expenses/list');
        }, 2000);
      } else {
        throw new Error(response.data.message || `An error occurred while ${isEditMode ? 'updating' : 'adding'} expense`);
      }
    } catch (err) {
      console.error('Error:', err);
      
      if (err.inner) {
        // Yup validation error
        const validationErrors = {};
        err.inner.forEach((error) => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
        setAlertSeverity('error');
        setMessage('Please correct the highlighted errors');
      } else {
        // API or other error
        setAlertSeverity('error');
        setMessage(err.response?.data?.message || 'Server error. Please try again.');
      }
      
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <CircularProgress size={60} />
        <p>Loading expense data...</p>
      </div>
    );
  }

  return (
    <div className="add-expenses-container">
      <div className="add-expenses-card">
        <div className="expense-header">
          <button 
            className="back-button" 
            onClick={handleCancel}
            title="Back to expense list"
          >
            <FaArrowLeft />
          </button>
          <h2>{isEditMode ? 'Edit Expense' : 'Add New Expense'}</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Expense ID</label>
              <div style={styles.inputGroup}>
                <FaIdCard style={styles.inputIcon} />
                <input
                  type="text"
                  name="expense_custom_id"
                  placeholder="Expense ID"
                  value={formData.expense_custom_id}
                  onChange={handleChange}
                  onBlur={handleCustomIdBlur}
                  required
                  disabled={isEditMode}
                  style={styles.idInput}
                />
                {!isEditMode && (
                  <button 
                    type="button" 
                    style={styles.generateBtn}
                    onClick={generateCustomId}
                    title="Generate new ID"
                  >
                    <FaSync />
                  </button>
                )}
              </div>
              {errors.expense_custom_id && <span style={styles.errorText}>{errors.expense_custom_id}</span>}
              <small className="id-hint">
                {isEditMode ? 'ID cannot be changed after creation' : 'A unique identifier for this expense. Auto-generated, but can be edited.'}
              </small>
            </div>
            <div className="form-group">
              <label>Date</label>
              <div style={styles.inputGroup}>
                <FaCalendar style={styles.inputIcon} />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.date && <span style={styles.errorText}>{errors.date}</span>}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expense Name</label>
              <div style={styles.inputGroup}>
                <FaTag style={styles.inputIcon} />
                <input
                  type="text"
                  name="expenses_name"
                  placeholder="Enter Expense Name"
                  value={formData.expenses_name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                {errors.expenses_name && <span style={styles.errorText}>{errors.expenses_name}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Cost</label>
              <div style={styles.inputGroup}>
                <FaMoneyBillAlt style={styles.inputIcon} />
                <input
                  type="number"
                  name="cost"
                  placeholder="Enter Cost"
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  style={styles.input}
                />
                {errors.cost && <span style={styles.errorText}>{errors.cost}</span>}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Description</label>
              <div style={styles.inputGroup}>
                <FaInfoCircle style={styles.inputIcon} />
                <textarea
                  name="description"
                  placeholder="Enter Description"
                  value={formData.description}
                  onChange={handleChange}
                  style={styles.textarea}
                />
                {errors.description && <span style={styles.errorText}>{errors.description}</span>}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Upload Files (Max 2)</label>
              <div style={styles.inputGroup}>
                <FaFileUpload style={styles.inputIcon} />
                <input
                  type="file"
                  name="files"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className={(existingFiles.length + selectedFiles.length) >= 2 ? 'disabled' : ''}
                  disabled={(existingFiles.length + selectedFiles.length) >= 2}
                  style={styles.input}
                />
              </div>
              <small className="file-hint">
                Supported formats: Images (JPG, PNG, GIF) and PDF files (Max 5MB each)
                {isEditMode && ` - ${2 - (existingFiles.length + selectedFiles.length)} slot(s) remaining`}
              </small>
            </div>
          </div>

          {/* Display existing files */}
          {existingFiles.length > 0 && (
            <div className="file-preview-container">
              <h4>Existing Files ({existingFiles.length})</h4>
              <div className="file-preview-list">
                {existingFiles.map((file, index) => (
                  <div key={`existing-${index}`} className="file-preview-item">
                    {file.content_type.startsWith('image/') ? (
                      <div className="file-preview-image">
                        <img 
                          src={file.file_url} // Already contains full URL from loadExistingFiles
                          alt={file.file_name} 
                        />
                      </div>
                    ) : (
                      <div className="file-preview-doc">
                        <FaFileAlt className="doc-icon" />
                      </div>
                    )}
                    <div className="file-preview-info">
                      <span className="file-name">{file.file_name}</span>
                      <button 
                        type="button" 
                        className="remove-file-btn" 
                        onClick={() => handleRemoveExistingFile(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display new files being added */}
          {filePreview.length > 0 && (
            <div className="file-preview-container">
              <h4>New Files ({filePreview.length})</h4>
              <div className="file-preview-list">
                {filePreview.map((file, index) => (
                  <div key={`new-${index}`} className="file-preview-item">
                    {file.type === 'image' ? (
                      <div className="file-preview-image">
                        <img src={file.url} alt={file.name} />
                      </div>
                    ) : (
                      <div className="file-preview-doc">
                        <FaFileAlt className="doc-icon" />
                      </div>
                    )}
                    <div className="file-preview-info">
                      <span className="file-name">{file.name}</span>
                      <button 
                        type="button" 
                        className="remove-file-btn" 
                        onClick={() => removeFile(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  <span style={{ marginLeft: '8px' }}>Processing...</span>
                </>
              ) : isEditMode ? (
                <>
                  <FaEdit style={{ marginRight: '8px' }} />
                  Update Expense
                </>
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Alert for success/error messages */}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={alertSeverity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
};

const AuthenticatedAddExpenses = withAuth(AddExpenses);
export default AuthenticatedAddExpenses;