// controllers/userAccountController.js

import sqldb from '../config/sqldb.js'; // Import your SQL database connection
import { createNotificationInternal, createRoleNotificationInternal } from './ownerControllers_7_notifications.js';
import { connectToDatabase } from '../config/mongodb.js'
import { ObjectId } from 'mongodb';


// Get all payment history for a user (no pagination)
export const getAllUserPaymentHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    // Query to get all payment history with related order details
    const query = `
      SELECT 
        p.payment_id,
        p.amount,
        p.payment_status,
        p.transaction_reference,
        p.payment_date,
        p.created_at,
        pm.name as payment_method_name,
        pm.is_online_payment,
        COUNT(o.order_id) as order_count,
        GROUP_CONCAT(o.order_id) as order_ids,
        GROUP_CONCAT(o.order_status) as order_statuses,
        GROUP_CONCAT(o.product_id) as product_ids,
        GROUP_CONCAT(o.quantity) as quantities,
        GROUP_CONCAT(o.total_price) as total_prices
      FROM payments p
      JOIN orders o ON p.payment_id = o.payment_id
      JOIN payment_methods pm ON p.payment_method_id = pm.payment_method_id
      WHERE o.customer_id = ?
      GROUP BY p.payment_id
      ORDER BY p.created_at DESC
    `;

    // Execute the query
    sqldb.query(query, [userId], (err, payments) => {
      if (err) {
        console.error('Error fetching payment history:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching payment history'
        });
      }

      // Process payment results
      const processedPayments = payments.map(payment => {
        // Split concatenated values
        const orderIds = payment.order_ids ? payment.order_ids.split(',').map(id => parseInt(id)) : [];
        const orderStatuses = payment.order_statuses ? payment.order_statuses.split(',') : [];
        const productIds = payment.product_ids ? payment.product_ids.split(',') : [];
        const quantities = payment.quantities ? payment.quantities.split(',').map(q => parseInt(q)) : [];
        const totalPrices = payment.total_prices ? payment.total_prices.split(',').map(p => parseFloat(p)) : [];
        
        // Create order items array with corresponding details
        const orderItems = orderIds.map((id, index) => ({
          order_id: id,
          status: orderStatuses[index] || 'Unknown',
          product_id: productIds[index] || 'Unknown',
          quantity: quantities[index] || 0,
          total_price: totalPrices[index] || 0
        }));

        return {
          payment_id: payment.payment_id,
          amount: parseFloat(payment.amount),
          payment_status: payment.payment_status,
          transaction_reference: payment.transaction_reference 
            ? payment.transaction_reference.substring(0, 8) + '...' // Show only first 8 chars
            : 'N/A',
          payment_date: payment.payment_date,
          created_at: payment.created_at,
          payment_method_name: payment.payment_method_name,
          is_online_payment: !!payment.is_online_payment,
          order_count: payment.order_count,
          order_summary: orderItems
        };
      });

      res.status(200).json({
        success: true,
        payments: processedPayments
      });
    });
  } catch (error) {
    console.error('Error in getAllUserPaymentHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user order history with optional status filter
export const getUserOrderHistory = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.query; // Get status filter from query params
  
  try {
    let query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.customer_id,
        o.product_id,
        o.variation_id,
        o.quantity,
        o.unit_price,
        o.total_price,
        o.delivery_fee,
        o.total_amount,
        o.order_status,
        o.created_at AS order_date,
        o.updated_at AS last_updated,
        
        p.ProductName AS product_name,
        p.ProductDescription AS product_description,
        p.Category1 AS category1,
        p.Category2 AS category2,
        p.Category3 AS category3,
        p.Material AS material,
        p.FabricType AS fabric_type,
        p.ReturnPolicy AS return_policy,
        
        s.SizeValue AS size_value,
        c.ColorValue AS color_value,
        
        a.contact_name AS recipient_name,
        a.street_address,
        a.apt_suite_unit,
        a.province,
        a.district,
        a.zip_code,
        a.mobile_number AS phone_number,
        
        pm.name AS payment_method_name,
        pm.description AS payment_method_description,
        pm.is_online_payment,
        
        pay.payment_status,
        pay.transaction_reference,
        pay.payment_date,
        pay.payment_intent_id,
        
        d.name AS delivery_method,
        d.description AS delivery_description,
        d.estimated_days
      FROM 
        orders o
      LEFT JOIN 
        product_table p ON o.product_id = p.ProductID
      LEFT JOIN 
        product_variations pv ON o.variation_id = pv.VariationID
      LEFT JOIN 
        sizes s ON pv.SizeID = s.SizeID
      LEFT JOIN 
        colors c ON pv.ColorID = c.ColorID
      LEFT JOIN 
        addresses a ON o.address_id = a.address_id
      LEFT JOIN 
        payment_methods pm ON o.payment_option_id = pm.payment_method_id
      LEFT JOIN 
        payments pay ON o.payment_id = pay.payment_id
      LEFT JOIN 
        delivery_options d ON o.delivery_option_id = d.delivery_id
      WHERE 
        o.customer_id = ?
    `;
    
    const queryParams = [userId];
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query += ` AND o.order_status = ?`;
      queryParams.push(status);
    }
    
    // Add order by clause
    query += ` ORDER BY o.created_at DESC`;

    // Execute the query
    sqldb.query(query, queryParams, async (err, orders) => {
      if (err) {
        console.error('Error fetching order history:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching order history'
        });
      }

      // Add tracking info for each order
      const processedOrders = await Promise.all(orders.map(async (order) => {
        let trackingData = null;
        
        // Only fetch tracking data for shipped or delivered orders
        if (order.order_status === 'Shipped' || order.order_status === 'Delivered') {
          // Get tracking info for this order
          trackingData = await new Promise((resolve, reject) => {
            sqldb.query(
              `SELECT 
                tracking_id, tracking_number, employee_id, delivery_date, 
                courier_agent_id, created_at, updated_at
              FROM 
                order_tracking 
              WHERE 
                order_id = ? 
              ORDER BY 
                created_at DESC`,
              [order.order_id],
              (err, results) => {
                if (err) reject(err);
                else resolve(results && results.length > 0 ? results[0] : null);
              }
            );
          });
          
          // If we have tracking data, get employee name
          if (trackingData && trackingData.employee_id) {
            const employeeData = await new Promise((resolve, reject) => {
              sqldb.query(
                `SELECT 
                  USERNAME, EMAIL, F_NAME, L_NAME
                FROM 
                  Polocity_Panel_Users
                WHERE 
                  ID = ?`,
                [trackingData.employee_id],
                (err, results) => {
                  if (err) reject(err);
                  else resolve(results && results.length > 0 ? results[0] : null);
                }
              );
            });
            
            if (employeeData) {
              trackingData.employee_name = employeeData.USERNAME || 
                `${employeeData.F_NAME || ''} ${employeeData.L_NAME || ''}`.trim();
              trackingData.employee_email = employeeData.EMAIL;
            }
          }
        }
        
        // Calculate expected delivery date based on order date and estimated days
        let expectedDeliveryDate = null;
        if (order.order_date && order.estimated_days !== null) {
          expectedDeliveryDate = new Date(order.order_date);
          expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + order.estimated_days);
        }
        
        // Create formatted shipping address
        const shippingAddress = {
          recipient_name: order.recipient_name,
          street_address: order.street_address,
          apt_suite_unit: order.apt_suite_unit || '',
          province: order.province,
          district: order.district,
          zip_code: order.zip_code,
          phone_number: order.phone_number
        };

        // Create tracking history format for backward compatibility
        let trackingHistory = [];
        if (trackingData) {
          // Initial shipping status
          trackingHistory.push({
            tracking_id: trackingData.tracking_id,
            status: 'Shipped',
            description: `Your order #${order.order_item_id} has been shipped.`,
            created_at: trackingData.created_at,
            tracking_number: trackingData.tracking_number,
            processed_by: trackingData.employee_name || 'Staff'
          });
          
          // Add delivered status if available
          if (order.order_status === 'Delivered' && trackingData.delivery_date) {
            trackingHistory.push({
              tracking_id: trackingData.tracking_id,
              status: 'Delivered',
              description: `Your order #${order.order_item_id} has been delivered.`,
              created_at: trackingData.delivery_date,
              tracking_number: trackingData.tracking_number,
              processed_by: trackingData.employee_name || 'Staff'
            });
          }
        }

        // Process order data
        return {
          order_id: order.order_id,
          order_item_id: order.order_item_id,
          product_name: order.product_name,
          product_description: order.product_description,
          
          // All three category levels
          category1: order.category1,
          category2: order.category2,
          category3: order.category3,
          
          material: order.material,
          fabric_type: order.fabric_type,
          return_policy: order.return_policy,
          
          size_value: order.size_value,
          color_value: order.color_value,
          
          quantity: order.quantity,
          unit_price: parseFloat(order.unit_price),
          total_price: parseFloat(order.total_price),
          delivery_fee: parseFloat(order.delivery_fee),
          total_amount: parseFloat(order.total_amount),
          
          order_status: order.order_status,
          order_date: order.order_date,
          expected_delivery_date: expectedDeliveryDate,
          
          payment_method: order.payment_method_name,
          payment_method_description: order.payment_method_description,
          payment_status: order.payment_status,
          transaction_reference: order.transaction_reference,
          payment_date: order.payment_date,
          is_online_payment: !!order.is_online_payment,
          
          shipping_address: shippingAddress,
          delivery_method: order.delivery_method,
          delivery_description: order.delivery_description,
          
          // Include both raw tracking data and formatted history
          tracking_data: trackingData,
          tracking_history: trackingHistory,
          
          // Flag to easily check if tracking is available
          has_tracking: !!trackingData
        };
      }));

      // Send available statuses along with the filtered orders
      const availableStatuses = ['Unpaid', 'To be Shipped', 'Shipped', 'Delivered', 'Processing', 'Failed', 'Cancelled', 'Refunded'];

      res.status(200).json({
        success: true,
        orders: processedOrders,
        availableStatuses: availableStatuses,
        totalCount: processedOrders.length,
        filteredStatus: status || 'all'
      });
    });
  } catch (error) {
    console.error('Error in getUserOrderHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get order counts by status for a user
export const getOrderStatusCounts = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const query = `
      SELECT 
        order_status,
        COUNT(*) as count
      FROM 
        orders
      WHERE 
        customer_id = ?
      GROUP BY 
        order_status
    `;
    
    sqldb.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching order counts:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching order counts'
        });
      }
      
      // Initialize counts for all possible statuses
      const statusCounts = {
        'Unpaid': 0,
        'To be Shipped': 0,
        'Shipped': 0,
        'Delivered': 0,
        'Processing': 0,
        'Failed': 0,
        'Cancelled': 0,
        'Refunded': 0
      };
      
      // Update counts with actual data
      results.forEach(result => {
        statusCounts[result.order_status] = result.count;
      });
      
      // Calculate total count
      const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      
      res.status(200).json({
        success: true,
        statusCounts,
        totalCount
      });
    });
  } catch (error) {
    console.error('Error in getOrderStatusCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.body; // User ID for verification
  
  let transactionStarted = false;
  
  try {
    // First, check if the order exists and belongs to the user with complete variation info
    const checkQuery = `
      SELECT 
        o.order_id, o.order_status, o.variation_id, o.quantity, o.payment_id, 
        o.total_amount, o.product_id, pv.units as current_stock,
        p.ProductName, c.NAME as customer_name
      FROM orders o
      LEFT JOIN product_variations pv ON o.variation_id = pv.VariationID
      LEFT JOIN product_table p ON o.product_id = p.ProductID
      LEFT JOIN customers c ON o.customer_id = c.ID
      WHERE o.order_id = ? AND o.customer_id = ?
    `;
    
    sqldb.query(checkQuery, [orderId, userId], async (err, results) => {
      if (err) {
        console.error('Error checking order:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error while checking order'
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or does not belong to this user'
        });
      }
      
      const order = results[0];
      const orderStatus = order.order_status.toLowerCase();
      
      // Only allow cancellation for Unpaid or To be Shipped orders
      if (orderStatus !== 'unpaid' && orderStatus !== 'to be shipped') {
        return res.status(403).json({
          success: false,
          message: 'Only unpaid or to-be-shipped orders can be cancelled'
        });
      }
      
      // Begin transaction for data consistency
      transactionStarted = true;
      await new Promise((resolve, reject) => {
        sqldb.beginTransaction(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      if (orderStatus === 'unpaid') {
        // CASE 1: For unpaid orders, simply update status to Cancelled
        const updateQuery = `
          UPDATE orders 
          SET order_status = 'Cancelled', 
              updated_at = NOW() 
          WHERE order_id = ?`;
        
        await new Promise((resolve, reject) => {
          sqldb.query(updateQuery, [orderId], (err, result) => {
            if (err) reject(err);
            else if (result.affectedRows === 0) {
              reject(new Error('No rows were updated when cancelling order'));
            } else resolve();
          });
        });
        
      } else if (orderStatus === 'to be shipped') {
        // CASE 2: For paid orders (to be shipped), restore stock and update status
        
        // 1. Restore stock quantity to product_variations
        if (order.variation_id && order.quantity > 0) {
          const restoreStockQuery = `
            UPDATE product_variations 
            SET units = units + ? 
            WHERE VariationID = ?
          `;
          
          const stockUpdateResult = await new Promise((resolve, reject) => {
            sqldb.query(
              restoreStockQuery, 
              [order.quantity, order.variation_id], 
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          });
          
          if (stockUpdateResult.affectedRows === 0) {
            throw new Error(`Failed to restore stock for variation ID ${order.variation_id}`);
          }
          
          console.log(`Restored ${order.quantity} units to variation ${order.variation_id} for product ${order.product_id}. New stock: ${order.current_stock + order.quantity}`);
        } else {
          console.warn(`Cannot restore stock: Invalid variation_id (${order.variation_id}) or quantity (${order.quantity})`);
        }
        
        // 2. Update order status to Processing (for refund processing)
        const updateOrderQuery = `
          UPDATE orders
          SET order_status = 'Processing', 
              updated_at = NOW()
          WHERE order_id = ?
        `;
        
        const orderUpdateResult = await new Promise((resolve, reject) => {
          sqldb.query(updateOrderQuery, [orderId], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        
        if (orderUpdateResult.affectedRows === 0) {
          throw new Error('Failed to update order status to Processing');
        }
        
        // 3. Create notification for admins about the cancelled paid order
        const notificationTitle = `Order #${orderId} Cancelled - Refund Required`;
        const notificationMessage = `Customer ${order.customer_name} cancelled order #${orderId} for ${order.ProductName} that was already paid. Amount: Rs. ${order.total_amount}. Please process the refund.`;
        
        // Directly insert notification into Polocity_Notifications table with correct column/value pairing
        const insertNotificationQuery = `
          INSERT INTO Polocity_Notifications
          (TITLE, MESSAGE, STATUS, ROLE)
          VALUES (?, ?, 'unread', ?)
        `;
        
        await new Promise((resolve, reject) => {
          sqldb.query(
            insertNotificationQuery,
            [notificationTitle, notificationMessage, 'admin'],
            (err, result) => {
              if (err) {
                console.error('Error creating notification:', err);
                reject(err);
              } else {
                console.log(`Created admin notification ID: ${result.insertId}`);
                resolve(result);
              }
            }
          );
        });
        
        // Optional: Also use the imported function as a backup, but with correct parameter order
        try {
          createRoleNotificationInternal('admin', notificationTitle, notificationMessage);
        } catch (notifError) {
          console.warn('Warning: createRoleNotificationInternal failed:', notifError.message);
          // Continue execution even if this fails as we already created the notification directly
        }
      }
      
      // Commit transaction
      await new Promise((resolve, reject) => {
        sqldb.commit(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Send appropriate success message based on order status
      if (orderStatus === 'unpaid') {
        return res.status(200).json({
          success: true,
          message: 'Order cancelled successfully'
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'Order cancellation and refund process initiated. Your refund will be processed by our team.'
        });
      }
    });
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    
    // Rollback if transaction was started
    if (transactionStarted) {
      try {
        await new Promise((resolve) => {
          sqldb.rollback(() => {
            console.log('Transaction rolled back due to error');
            resolve();
          });
        });
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during order cancellation'
    });
  }
};

// Add these controller functions

// Get specific order by ID for return form
export const getUserOrderById = async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.query;
  
  if (!orderId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID and User ID are required'
    });
  }
  
  try {
    // Use existing query structure from getUserOrderHistory but with specific order ID
    const query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.customer_id,
        o.product_id,
        o.variation_id,
        o.quantity,
        o.unit_price,
        o.total_price,
        o.delivery_fee,
        o.total_amount,
        o.order_status,
        o.created_at AS order_date,
        o.updated_at AS last_updated,
        
        p.ProductName AS product_name,
        p.ProductDescription AS product_description,
        p.Category1 AS category1,
        p.Category2 AS category2,
        p.Category3 AS category3,
        p.Material AS material,
        p.FabricType AS fabric_type,
        p.ReturnPolicy AS return_policy,
        
        s.SizeValue AS size_value,
        c.ColorValue AS color_value,
        
        a.contact_name AS recipient_name,
        a.street_address,
        a.apt_suite_unit,
        a.province,
        a.district,
        a.zip_code,
        a.mobile_number AS phone_number
      FROM 
        orders o
      LEFT JOIN 
        product_table p ON o.product_id = p.ProductID
      LEFT JOIN 
        product_variations pv ON o.variation_id = pv.VariationID
      LEFT JOIN 
        sizes s ON pv.SizeID = s.SizeID
      LEFT JOIN 
        colors c ON pv.ColorID = c.ColorID
      LEFT JOIN 
        addresses a ON o.address_id = a.address_id
      WHERE 
        o.order_id = ? AND o.customer_id = ?
    `;
    
    sqldb.query(query, [orderId, userId], (err, results) => {
      if (err) {
        console.error('Error fetching order details:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error while fetching order details'
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or does not belong to this user'
        });
      }
      
      res.status(200).json({
        success: true,
        order: results[0]
      });
    });
  } catch (error) {
    console.error('Error in getUserOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update the submitReturnRequest function:

// Submit return request with images
export const submitReturnRequest = async (req, res) => {
  const { orderId, userId, returnReason, additionalInfo } = req.body;
  const images = req.files;
  
  console.log('Received return request for order:', orderId);
  console.log('Files received:', images ? images.length : 'No files');
  console.log('Return reason:', returnReason);
  
  // Validation
  if (!orderId || !userId || !returnReason) {
    return res.status(400).json({
      success: false,
      message: 'Order ID, User ID, and return reason are required'
    });
  }
  
  if (!images || images.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one image is required'
    });
  }
  
  let transactionStarted = false;
  let imageIds = [];
  
  try {
    // Check if order exists and belongs to user
    const checkOrderQuery = `
      SELECT o.order_id, o.order_status, o.product_id, p.ProductName 
      FROM orders o
      JOIN product_table p ON o.product_id = p.ProductID
      WHERE o.order_id = ? AND o.customer_id = ?
    `;
    
    const orderResult = await new Promise((resolve, reject) => {
      sqldb.query(checkOrderQuery, [orderId, userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to this user'
      });
    }
    
    const order = orderResult[0];
    
    // Check if order is in delivered status
    if (order.order_status !== 'Delivered') {
      return res.status(403).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }
    
    // Check if return already exists for this order
    const checkReturnQuery = `
      SELECT return_id FROM order_returns
      WHERE order_id = ?
    `;
    
    const returnResult = await new Promise((resolve, reject) => {
      sqldb.query(checkReturnQuery, [orderId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (returnResult.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A return request already exists for this order'
      });
    }
    
    // Start transaction
    transactionStarted = true;
    await new Promise((resolve, reject) => {
      sqldb.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Process images and store in MongoDB
    try {
      // Connect to MongoDB
      const { db } = await connectToDatabase();
      const returnsCollection = db.collection('order_returns_images');
      
      // Create image objects for each uploaded file
      const imagesArray = images.map((file, index) => ({
        order_id: orderId,
        image_name: file.originalname,
        image_data: file.buffer.toString('base64'),
        content_type: file.mimetype,
        uploaded_at: new Date(),
        is_primary: index === 0, // First image is primary by default
        order: index + 1
      }));
      
      // Store images in MongoDB
      const imageResult = await returnsCollection.insertMany(imagesArray);
      
      // Get the inserted image IDs for reference in MySQL
      imageIds = Object.values(imageResult.insertedIds).map(id => id.toString());
      
      console.log(`Successfully stored ${imagesArray.length} images to MongoDB for return request`);
      console.log('Image IDs:', imageIds);
    } catch (imgError) {
      console.error('Error uploading images to MongoDB:', imgError);
      throw new Error('Failed to upload images: ' + imgError.message);
    }
    
    // Create return request record in MySQL with image references
    const insertReturnQuery = `
      INSERT INTO order_returns (
        order_id, 
        customer_id, 
        return_reason, 
        return_status,
        admin_notes,
        created_at
      ) VALUES (?, ?, ?, 'Pending', ?, NOW())
    `;
    
    const insertResult = await new Promise((resolve, reject) => {
      sqldb.query(
        insertReturnQuery, 
        [orderId, userId, returnReason, additionalInfo || null],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    // Get the inserted return ID
    const returnId = insertResult.insertId;
    
    // Update the MongoDB images with the return_id for easier querying
    try {
      const { db } = await connectToDatabase();
      const returnsCollection = db.collection('order_returns_images');
      
      for (const imageId of imageIds) {
        await returnsCollection.updateOne(
          { _id: new ObjectId(imageId) },
          { $set: { return_id: returnId.toString() } }
        );
      }
    } catch (updateError) {
      console.error('Error updating images with return_id:', updateError);
      // Continue execution since we still have the order_id reference
    }
    
    // Update order status to "Return Requested"
    const updateOrderQuery = `
      UPDATE orders
      SET order_status = 'Return Requested', 
          updated_at = NOW()
      WHERE order_id = ?
    `;
    
    await new Promise((resolve, reject) => {
      sqldb.query(updateOrderQuery, [orderId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // Create notification for admins about the return request
    const notificationTitle = `Return Request: Order #${orderId}`;
    const notificationMessage = `Customer has requested a return for order #${orderId} (${order.ProductName}). Reason: ${returnReason}`;
    
    const insertNotificationQuery = `
      INSERT INTO Polocity_Notifications
      (TITLE, MESSAGE, STATUS, ROLE)
      VALUES (?, ?, 'unread', ?)
    `;
    
    await new Promise((resolve, reject) => {
      sqldb.query(
        insertNotificationQuery,
        [notificationTitle, notificationMessage, 'admin'],
        (err, result) => {
          if (err) {
            console.error('Error creating notification:', err);
            reject(err);
          } else {
            console.log(`Created admin notification ID: ${result.insertId}`);
            resolve(result);
          }
        }
      );
    });
    
    // Also create a notification through the notification service
    try {
      createRoleNotificationInternal('admin', notificationTitle, notificationMessage);
    } catch (notifError) {
      console.warn('Warning: Secondary notification failed:', notifError.message);
      // Continue execution as primary notification already created
    }
    
    // Commit transaction
    await new Promise((resolve, reject) => {
      sqldb.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully',
      returnId: returnId,
      imageCount: imageIds.length
    });
    
  } catch (error) {
    console.error('Error in submitReturnRequest:', error);
    
    // Rollback if transaction was started
    if (transactionStarted) {
      try {
        await new Promise((resolve) => {
          sqldb.rollback(() => {
            console.log('Transaction rolled back due to error');
            resolve();
          });
        });
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during return request submission'
    });
  }
};

// Add function to retrieve return images

// Get images for a specific order return
export const getReturnImages = async (req, res) => {
  const { orderId } = req.params;
  
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const returnsCollection = db.collection('order_returns_images');
    
    // Find all images for this order
    const images = await returnsCollection.find({ order_id: orderId }).toArray();
    
    if (!images || images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found for this return request'
      });
    }
    
    // Process image data to return metadata only (not the actual image data)
    const imageMetadata = images.map(img => ({
      id: img._id,
      order_id: img.order_id,
      image_name: img.image_name,
      content_type: img.content_type,
      uploaded_at: img.uploaded_at
    }));
    
    res.status(200).json({
      success: true,
      images: imageMetadata
    });
    
  } catch (error) {
    console.error('Error fetching return images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching return images'
    });
  }
};

// Get a specific image by ID
export const getReturnImageById = async (req, res) => {
  const { imageId } = req.params;
  
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const returnsCollection = db.collection('order_returns_images');
    
    // Find the specific image
    const image = await returnsCollection.findOne({ _id: new ObjectId(imageId) });
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Convert the image data from base64 to a buffer
    const imageBuffer = Buffer.from(image.image_data, 'base64');
    
    // Set the appropriate content type
    res.set('Content-Type', image.content_type);
    res.set('Content-Disposition', `inline; filename="${image.image_name}"`);
    
    // Send the image data
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Error fetching return image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching return image'
    });
  }
};

// Add this new function to get all return requests for a user

export const getUserReturnRequests = async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  try {
    // Query to get all return requests with order details
    const query = `
      SELECT 
        r.return_id,
        r.order_id,
        r.return_reason,
        r.return_status,
        r.admin_notes,
        r.created_at,
        r.updated_at,
        
        o.order_status,
        o.product_id,
        o.variation_id,
        o.quantity,
        o.total_amount,
        o.created_at AS order_date,
        
        p.ProductName AS product_name,
        
        s.SizeValue AS size_value,
        c.ColorValue AS color_value
      FROM 
        order_returns r
      JOIN 
        orders o ON r.order_id = o.order_id
      LEFT JOIN 
        product_table p ON o.product_id = p.ProductID
      LEFT JOIN 
        product_variations pv ON o.variation_id = pv.VariationID
      LEFT JOIN 
        sizes s ON pv.SizeID = s.SizeID
      LEFT JOIN 
        colors c ON pv.ColorID = c.ColorID
      WHERE 
        r.customer_id = ?
      ORDER BY 
        r.created_at DESC
    `;
    
    const returnRequests = await new Promise((resolve, reject) => {
      sqldb.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    // Fetch image info for each return request
    const returnRequestsWithImages = await Promise.all(returnRequests.map(async (request) => {
      try {
        // Get images from MongoDB
        const { db } = await connectToDatabase();
        const returnsCollection = db.collection('order_returns_images');
        
        const images = await returnsCollection.find({ 
          order_id: request.order_id.toString() 
        }).toArray();
        
        // Generate image URLs
        const imageUrls = images.map((image, index) => ({
          id: image._id.toString(),
          url: `/api/user/return-image/${image._id}`,
          name: image.image_name,
          contentType: image.content_type
        }));
        
        // Format status description based on return status
        let statusDescription;
        switch (request.return_status) {
          case 'Pending':
            statusDescription = 'Your return request is being reviewed';
            break;
          case 'Approved':
            statusDescription = 'Your return request has been approved';
            break;
          case 'Rejected':
            statusDescription = 'Your return request was not approved';
            break;
          case 'Completed':
            statusDescription = 'Your return has been processed and completed';
            break;
          default:
            statusDescription = 'Status information unavailable';
        }
        
        // Get formatted date
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        };
        
        return {
          ...request,
          formatted_created_at: formatDate(request.created_at),
          formatted_order_date: formatDate(request.order_date),
          status_description: statusDescription,
          images: imageUrls
        };
      } catch (error) {
        console.error(`Error fetching images for return request ${request.return_id}:`, error);
        return {
          ...request,
          images: [],
          error: 'Error fetching images'
        };
      }
    }));
    
    res.status(200).json({
      success: true,
      returnRequests: returnRequestsWithImages,
      count: returnRequestsWithImages.length
    });
    
  } catch (error) {
    console.error('Error in getUserReturnRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching return requests'
    });
  }
};