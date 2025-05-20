//controllers/ownerControllers_4_expenses.js

import sqldb from '../config/sqldb.js';
import { connectToDatabase } from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

// Add this new function to check if a custom ID already exists
export const checkExpenseIdExists = (req, res) => {
  const { customId } = req.params;
  
  if (!customId) {
    return res.status(400).json({ 
      message: 'Custom ID is required', 
      Status: 'error' 
    });
  }
  
  const sql = 'SELECT COUNT(*) as count FROM expenses WHERE expense_custom_id = ?';
  
  sqldb.query(sql, [customId], (err, result) => {
    if (err) {
      console.error('Error checking expense ID:', err);
      return res.status(500).json({ 
        message: 'Error checking expense ID',
        Status: 'error',
        error: err.message
      });
    }
    
    res.status(200).json({
      exists: result[0].count > 0,
      Status: 'success'
    });
  });
};

// Update the ownerAddExpenses function to handle custom ID
export const ownerAddExpenses = async (req, res) => {
  try {
    console.log('Received request to add expense');
    console.log('Files received:', req.files ? req.files.length : 'No files');
    console.log('Body:', req.body);

    // Extract form data from req.body
    const { date, expense_custom_id, expenses_name, cost, description } = req.body;

    // Validate required fields
    if (!date || !expenses_name || !cost || !expense_custom_id) {
      return res.status(400).json({ 
        message: 'Date, expense ID, name, and cost are required fields', 
        Status: 'error' 
      });
    }

    // Validate file types - only allow images and PDFs
    if (req.files && req.files.length > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      
      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            message: `File type "${file.mimetype}" is not allowed. Only images and PDF files are accepted.`,
            Status: 'error'
          });
        }
      }
    }

    // Check if custom ID already exists
    const checkIdSql = 'SELECT COUNT(*) as count FROM expenses WHERE expense_custom_id = ?';
    
    sqldb.query(checkIdSql, [expense_custom_id], async (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Error checking expense ID:", checkErr);
        return res.status(500).json({ 
          message: "Error checking expense ID",
          error: checkErr.message,
          Status: 'error'
        });
      }
      
      if (checkResult[0].count > 0) {
        return res.status(409).json({ 
          message: "This expense ID is already in use. Please use a different ID.",
          Status: 'error'
        });
      }
      
      // If ID is unique, proceed with insertion
      // Insert expense into MySQL expenses table
      const sql = `INSERT INTO expenses 
                  (expense_custom_id, date, expenses_name, cost, description) 
                  VALUES (?, ?, ?, ?, ?)`;

      const values = [
        expense_custom_id, // custom ID
        date,              // date
        expenses_name,     // expenses_name
        cost,              // cost
        description || null // description
      ];

      // Execute the SQL query to insert expense data
      sqldb.query(sql, values, async (err, result) => {
        if (err) {
          console.error("Error inserting expense data:", err);
          return res.status(500).json({ 
            message: "Error inserting data into the database",
            error: err.message,
            Status: 'error'
          });
        }

        console.log("Expense data added successfully");
        const expenseId = result.insertId;

        // Handle file uploads if files are present
        let uploadedFilesSummary = [];
        if (req.files && req.files.length > 0) {
          try {
            console.log(`Processing ${req.files.length} files for expense ID: ${expenseId}`);
            
            // Connect to MongoDB
            const { db } = await connectToDatabase();
            const expensesCollection = db.collection('expenses');
            
            // Create file objects for each uploaded file
            const filesArray = req.files.map((file, index) => ({
              file_name: file.originalname,
              file_data: file.buffer.toString('base64'),
              content_type: file.mimetype,
              uploaded_at: new Date(),
              size: file.size,
              order: index + 1
            }));
            
            // Create metadata for response (without base64 data)
            uploadedFilesSummary = filesArray.map(file => ({
              name: file.file_name,
              content_type: file.content_type,
              size: file.size,
              order: file.order
            }));
            
            // Create a document with both expense IDs and files array
            const result = await expensesCollection.updateOne(
              { 
                expense_id: expenseId.toString(),
                expense_custom_id: expense_custom_id
              },
              {
                $setOnInsert: { created_at: new Date() },
                $set: { 
                  expense_id: expenseId.toString(),
                  expense_custom_id: expense_custom_id,
                  updated_at: new Date() 
                },
                $push: { 
                  files: { $each: filesArray } 
                }
              },
              { upsert: true }
            );
            
            console.log(`Successfully stored ${filesArray.length} files to MongoDB for expense ID: ${expenseId}`);
          } catch (fileError) {
            console.error('Error uploading files to MongoDB:', fileError);
            // Continue with expense creation even if file upload fails
            return res.status(201).json({ 
              message: "Expense added but files couldn't be uploaded",
              expenseId: expenseId,
              customId: expense_custom_id,
              Status: "Success",
              fileError: fileError.message
            });
          }
        }

        // Send success response
        res.status(201).json({ 
          message: "Expense added successfully", 
          expenseId: expenseId,
          customId: expense_custom_id,
          Status: "Success",
          uploadedFiles: uploadedFilesSummary.length > 0 ? uploadedFilesSummary : []
        });
      });
    });
  } catch (error) {
    console.error('Error in expense creation:', error);
    res.status(500).json({
      message: error.message || 'Error processing expense creation',
      Status: 'error'
    });
  }
};

// Update getAllExpenses to include file count from MongoDB
export const getAllExpenses = async (req, res) => {
  try {
    const sql = `
      SELECT * FROM expenses
      ORDER BY date DESC, expenses_id DESC
    `;
    
    sqldb.query(sql, async (err, result) => {
      if (err) {
        console.error('Error fetching expenses:', err);
        return res.status(500).json({ 
          message: 'Error fetching expenses from database',
          Status: 'error',
          error: err.message
        });
      }
      
      try {
        // Connect to MongoDB to get file information for each expense
        const { db } = await connectToDatabase();
        const expensesCollection = db.collection('expenses');
        
        // Create a map to store expense id to file count
        const fileCountMap = {};
        
        // Get all expense documents from MongoDB
        const expenseFiles = await expensesCollection.find({}).toArray();
        
        // Populate the file count map
        expenseFiles.forEach(doc => {
          if (doc.expense_id) {
            fileCountMap[doc.expense_id] = doc.files ? doc.files.length : 0;
          }
        });
        
        // Format dates and add file count to each expense
        const formattedExpenses = result.map(expense => {
          const expenseIdStr = expense.expenses_id.toString();
          return {
            ...expense,
            date: new Date(expense.date).toISOString().split('T')[0], // Format as YYYY-MM-DD
            createdAt: new Date(expense.createdAt).toISOString(),
            updatedAt: new Date(expense.updatedAt).toISOString(),
            fileCount: fileCountMap[expenseIdStr] || 0
          };
        });
        
        res.status(200).json({
          Status: 'success',
          count: formattedExpenses.length,
          expenses: formattedExpenses,
          total: formattedExpenses.reduce((sum, expense) => sum + parseFloat(expense.cost), 0).toFixed(2)
        });
      } catch (mongoError) {
        console.error('Error connecting to MongoDB:', mongoError);
        
        // Still return expenses but without file counts
        const formattedExpenses = result.map(expense => ({
          ...expense,
          date: new Date(expense.date).toISOString().split('T')[0],
          createdAt: new Date(expense.createdAt).toISOString(),
          updatedAt: new Date(expense.updatedAt).toISOString(),
          fileCount: 0
        }));
        
        res.status(200).json({
          Status: 'partial_success',
          message: 'Expenses fetched but file information could not be loaded',
          count: formattedExpenses.length,
          expenses: formattedExpenses,
          total: formattedExpenses.reduce((sum, expense) => sum + parseFloat(expense.cost), 0).toFixed(2),
          mongoError: mongoError.message
        });
      }
    });
  } catch (error) {
    console.error('Error in getAllExpenses:', error);
    res.status(500).json({
      message: error.message || 'Error fetching expenses',
      Status: 'error'
    });
  }
};

// Get files for an expense - separate endpoint for just files
export const getExpenseFiles = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    if (!expenseId) {
      return res.status(400).json({
        message: 'Expense ID is required',
        Status: 'error'
      });
    }
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const expensesCollection = db.collection('expenses');
    
    // Find the expense document by either numeric ID or custom ID
    const expense = await expensesCollection.findOne({
      $or: [
        { expense_id: expenseId.toString() },
        { expense_custom_id: expenseId }
      ]
    });
    
    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found',
        Status: 'error'
      });
    }
    
    if (!expense.files || expense.files.length === 0) {
      return res.status(200).json({
        message: 'No files found for this expense',
        Status: 'success',
        expense_id: expense.expense_id,
        expense_custom_id: expense.expense_custom_id,
        files: []
      });
    }
    
    // Map and format the file data (exclude the actual file content)
    const formattedFiles = expense.files.map((file, index) => ({
      index: index,
      file_name: file.file_name,
      content_type: file.content_type,
      uploaded_at: file.uploaded_at,
      size: file.size,
      order: file.order,
      file_url: `/api/owner/expenses/${expense.expense_custom_id}/files/${index}`
    }));
    
    res.status(200).json({
      Status: 'success',
      expense_id: expense.expense_id,
      expense_custom_id: expense.expense_custom_id,
      count: formattedFiles.length,
      files: formattedFiles
    });
  } catch (error) {
    console.error('Error fetching expense files:', error);
    res.status(500).json({
      message: 'Error fetching expense files',
      error: error.message,
      Status: 'error'
    });
  }
};

// Improved file serving function
export const getExpenseFileById = async (req, res) => {
  try {
    const { expenseId, fileIndex } = req.params;
    const { download } = req.query; // Add a download query parameter
    
    if (!expenseId || fileIndex === undefined) {
      return res.status(400).json({
        message: 'Expense ID and file index are required',
        Status: 'error'
      });
    }
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const expensesCollection = db.collection('expenses');
    
    // Find the expense document
    const expense = await expensesCollection.findOne({
      $or: [
        { expense_id: expenseId.toString() },
        { expense_custom_id: expenseId }
      ]
    });
    
    if (!expense || !expense.files || expense.files.length === 0) {
      return res.status(404).json({
        message: 'Expense or files not found',
        Status: 'error'
      });
    }
    
    const index = parseInt(fileIndex);
    const file = expense.files[index];
    
    if (!file) {
      return res.status(404).json({
        message: 'File not found at specified index',
        Status: 'error'
      });
    }
    
    // Convert the base64 file data to a buffer
    const fileBuffer = Buffer.from(file.file_data, 'base64');
    
    // Set appropriate headers for CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set content type
    res.set('Content-Type', file.content_type);
    
    // Set content length
    res.set('Content-Length', fileBuffer.length);
    
    // Determine if this should be a download or inline display
    // If download parameter is present, force download
    const disposition = download ? 'attachment' : 
                       (file.content_type.startsWith('image/') || file.content_type === 'application/pdf' ? 
                        'inline' : 'attachment');
    
    // Ensure filename is properly encoded
    const encodedFilename = encodeURIComponent(file.file_name);
    res.set('Content-Disposition', `${disposition}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    
    // Send the file data
    return res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error fetching expense file:', error);
    res.status(500).json({
      message: 'Error fetching file',
      error: error.message,
      Status: 'error'
    });
  }
};

// Update getExpenseById to include file information
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        message: 'Expense ID is required', 
        Status: 'error' 
      });
    }
    
    // Modify the SQL query to check both ID fields
    const sql = `
      SELECT * FROM expenses 
      WHERE expenses_id = ? OR expense_custom_id = ?
    `;
    
    sqldb.query(sql, [id, id], async (err, result) => {
      if (err) {
        console.error('Error fetching expense:', err);
        return res.status(500).json({ 
          message: 'Error fetching expense from database',
          Status: 'error',
          error: err.message
        });
      }
      
      if (!result || result.length === 0) {
        return res.status(404).json({ 
          message: 'Expense not found',
          Status: 'error'
        });
      }
      
      // Format dates for consistency
      const expense = {
        ...result[0],
        date: new Date(result[0].date).toISOString().split('T')[0], // Format as YYYY-MM-DD
        createdAt: new Date(result[0].createdAt).toISOString(),
        updatedAt: new Date(result[0].updatedAt).toISOString()
      };
      
      // Get file information from MongoDB
      const { db } = await connectToDatabase();
      const expensesCollection = db.collection('expenses');
      
      const expenseDoc = await expensesCollection.findOne({
        $or: [
          { expense_id: expense.expenses_id.toString() },
          { expense_custom_id: expense.expense_custom_id }
        ]
      });
      
      // Add file information to response
      const fileInfo = [];
      if (expenseDoc && expenseDoc.files && expenseDoc.files.length > 0) {
        expenseDoc.files.forEach((file, index) => {
          fileInfo.push({
            index,
            file_name: file.file_name,
            content_type: file.content_type,
            uploaded_at: file.uploaded_at,
            size: file.size,
            file_url: `/api/owner/expenses/${expense.expense_custom_id}/files/${index}`
          });
        });
      }
      
      expense.files = fileInfo;
      expense.fileCount = fileInfo.length;
      
      res.status(200).json({
        Status: 'success',
        expense
      });
    });
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    res.status(500).json({
      message: error.message || 'Error fetching expense details',
      Status: 'error'
    });
  }
};

// Update the updateExpense function to handle file updates

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, expense_custom_id, expenses_name, cost, description } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        message: 'Expense ID is required', 
        Status: 'error' 
      });
    }
    
    if (!date || !expenses_name || !cost) {
      return res.status(400).json({ 
        message: 'Date, expense name, and cost are required fields', 
        Status: 'error' 
      });
    }
    
    // First, get the current expense data 
    const getCurrentExpense = `
      SELECT * FROM expenses 
      WHERE expenses_id = ? OR expense_custom_id = ?
    `;
    
    sqldb.query(getCurrentExpense, [id, id], async (getErr, getResult) => {
      if (getErr) {
        console.error("Error fetching current expense data:", getErr);
        return res.status(500).json({ 
          message: "Error fetching current expense data",
          Status: "error",
          error: getErr.message
        });
      }
      
      if (!getResult || getResult.length === 0) {
        return res.status(404).json({ 
          message: "Expense not found",
          Status: "error" 
        });
      }
      
      const currentExpense = getResult[0];
      
      // Update expense in MySQL database
      const updateSql = `
        UPDATE expenses
        SET 
          date = ?,
          expenses_name = ?,
          cost = ?,
          description = ?,
          updatedAt = NOW()
        WHERE expenses_id = ?
      `;
      
      const updateValues = [
        date,
        expenses_name,
        cost,
        description || null,
        currentExpense.expenses_id
      ];
      
      sqldb.query(updateSql, updateValues, async (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating expense:", updateErr);
          return res.status(500).json({ 
            message: "Error updating expense in database",
            Status: "error",
            error: updateErr.message
          });
        }
        
        // Handle file updates in MongoDB
        try {
          // Connect to MongoDB
          const { db } = await connectToDatabase();
          const expensesCollection = db.collection('expenses');
          
          // Get the existing document
          const expenseDoc = await expensesCollection.findOne({
            $or: [
              { expense_id: currentExpense.expenses_id.toString() },
              { expense_custom_id: currentExpense.expense_custom_id }
            ]
          });
          
          // Process new files if any
          if (req.files && req.files.length > 0) {
            const newFiles = req.files.map((file, index) => ({
              file_name: file.originalname,
              file_data: file.buffer.toString('base64'),
              content_type: file.mimetype,
              uploaded_at: new Date(),
              size: file.size,
              order: index + 1
            }));
            
            // If document exists, append files, otherwise create a new one
            if (expenseDoc) {
              await expensesCollection.updateOne(
                { _id: expenseDoc._id },
                { 
                  $push: { files: { $each: newFiles } },
                  $set: { updated_at: new Date() }
                }
              );
            } else {
              // Create new document if none exists (rare case but possible)
              await expensesCollection.insertOne({
                expense_id: currentExpense.expenses_id.toString(),
                expense_custom_id: currentExpense.expense_custom_id,
                created_at: new Date(),
                updated_at: new Date(),
                files: newFiles
              });
            }
          }
          
          // Process removed files if specified
          const removedFiles = req.body.removedFiles ? JSON.parse(req.body.removedFiles) : [];
          
          if (removedFiles.length > 0 && expenseDoc && expenseDoc.files) {
            // Filter out the files to keep
            const updatedFiles = expenseDoc.files.filter((file, index) => 
              !removedFiles.includes(index)
            );
            
            // Update the document with the filtered files array
            await expensesCollection.updateOne(
              { _id: expenseDoc._id },
              { 
                $set: { 
                  files: updatedFiles,
                  updated_at: new Date() 
                }
              }
            );
          }
          
          // Success response
          return res.status(200).json({ 
            message: "Expense updated successfully", 
            Status: "success",
            expenseId: currentExpense.expenses_id,
            customId: currentExpense.expense_custom_id
          });
        } catch (mongoErr) {
          console.error("Error updating files in MongoDB:", mongoErr);
          
          // Still return success for MySQL update but note MongoDB error
          return res.status(200).json({ 
            message: "Expense details updated but file changes may not be saved", 
            Status: "success",
            expenseId: currentExpense.expenses_id,
            customId: currentExpense.expense_custom_id,
            fileWarning: true,
            mongoError: mongoErr.message
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in updateExpense:', error);
    res.status(500).json({
      message: error.message || 'Error updating expense',
      Status: 'error'
    });
  }
};

// Update deleteExpense to handle custom ID
export const deleteExpense = (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ 
      message: 'Expense ID is required', 
      Status: 'error' 
    });
  }
  
  // Get the expense details first (to get both IDs)
  const getExpenseSql = 'SELECT * FROM expenses WHERE expenses_id = ? OR expense_custom_id = ?';
  
  sqldb.query(getExpenseSql, [id, id], async (getErr, getResult) => {
    if (getErr) {
      console.error('Error fetching expense details:', getErr);
      return res.status(500).json({ 
        message: 'Error fetching expense details from database',
        Status: 'error',
        error: getErr.message
      });
    }
    
    if (!getResult || getResult.length === 0) {
      return res.status(404).json({ 
        message: 'Expense not found',
        Status: 'error'
      });
    }
    
    const expense = getResult[0];
    const expenseId = expense.expenses_id.toString();
    const expenseCustomId = expense.expense_custom_id;
    
    // Delete from MySQL
    const deleteSql = 'DELETE FROM expenses WHERE expenses_id = ?';
    
    sqldb.query(deleteSql, [expense.expenses_id], async (err, result) => {
      if (err) {
        console.error('Error deleting expense:', err);
        return res.status(500).json({ 
          message: 'Error deleting expense from database',
          Status: 'error',
          error: err.message
        });
      }
      
      // Delete associated files from MongoDB
      try {
        const { db } = await connectToDatabase();
        const expensesCollection = db.collection('expenses');
        
        // Find and delete by both IDs
        await expensesCollection.deleteOne({
          $or: [
            { expense_id: expenseId },
            { expense_custom_id: expenseCustomId }
          ]
        });
        
        console.log(`Deleted files for expense ${expenseId} (${expenseCustomId}) from MongoDB`);
      } catch (mongoErr) {
        console.error('Error deleting expense files from MongoDB:', mongoErr);
        // Continue with success response even if MongoDB delete fails
      }
      
      res.status(200).json({
        message: 'Expense deleted successfully',
        Status: 'success',
        affectedRows: result.affectedRows
      });
    });
  });
};