import sqldb from '../config/sqldb.js';

// Get all orders with "To be Shipped" status
export const getOrdersToBeShipped = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.product_id,
        o.variation_id,
        o.quantity,
        o.unit_price,
        o.total_price,
        o.delivery_fee,
        o.total_amount,
        o.order_status,
        o.created_at AS order_date,
        p.ProductName AS product_name,
        s.SizeValue AS size_value,
        col.ColorValue AS color_value,
        a.contact_name AS recipient_name,
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
        colors col ON pv.ColorID = col.ColorID
      LEFT JOIN 
        addresses a ON o.address_id = a.address_id
      WHERE 
        o.order_status = 'To be Shipped'
      ORDER BY 
        o.order_item_id ASC
    `;

    sqldb.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching orders to be shipped:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while fetching orders'
        });
      }

      return res.status(200).json({
        success: true,
        orders: results
      });
    });
  } catch (error) {
    console.error('Error in getOrdersToBeShipped:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all shipped orders
export const getShippedOrders = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.product_id,
        o.variation_id,
        o.quantity,
        o.unit_price,
        o.total_price,
        o.delivery_fee,
        o.total_amount,
        o.order_status,
        o.created_at AS order_date,
        p.ProductName AS product_name,
        s.SizeValue AS size_value,
        col.ColorValue AS color_value,
        a.contact_name AS recipient_name,
        a.mobile_number AS phone_number,
        ot.tracking_number,
        ot.created_at AS shipped_date
      FROM 
        orders o
      LEFT JOIN 
        product_table p ON o.product_id = p.ProductID
      LEFT JOIN 
        product_variations pv ON o.variation_id = pv.VariationID
      LEFT JOIN 
        sizes s ON pv.SizeID = s.SizeID
      LEFT JOIN 
        colors col ON pv.ColorID = col.ColorID
      LEFT JOIN 
        addresses a ON o.address_id = a.address_id
      LEFT JOIN
        order_tracking ot ON o.order_id = ot.order_id
      WHERE 
        o.order_status = 'Shipped'
      ORDER BY 
        o.order_item_id ASC
    `;

    sqldb.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching shipped orders:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while fetching shipped orders'
        });
      }

      return res.status(200).json({
        success: true,
        orders: results
      });
    });
  } catch (error) {
    console.error('Error in getShippedOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get detailed order information
export const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  
  try {
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
        
        c.NAME AS customer_name,
        c.EMAIL AS customer_email,
        c.PHONE_NUM AS customer_phone,
        
        p.ProductName AS product_name,
        p.ProductDescription,
        p.Category1, p.Category2, p.Category3,
        
        s.SizeValue AS size_value,
        col.ColorValue AS color_value,
        
        a.contact_name AS recipient_name,
        a.street_address,
        a.apt_suite_unit,
        a.province,
        a.district,
        a.zip_code,
        a.mobile_number AS phone_number,
        
        do.name AS delivery_option_name,
        do.estimated_days,
        
        pm.name AS payment_method_name,
        
        ot.tracking_number,
        ot.created_at AS shipped_date
      FROM 
        orders o
      LEFT JOIN 
        customers c ON o.customer_id = c.ID
      LEFT JOIN 
        product_table p ON o.product_id = p.ProductID
      LEFT JOIN 
        product_variations pv ON o.variation_id = pv.VariationID
      LEFT JOIN 
        sizes s ON pv.SizeID = s.SizeID
      LEFT JOIN 
        colors col ON pv.ColorID = col.ColorID
      LEFT JOIN 
        addresses a ON o.address_id = a.address_id
      LEFT JOIN
        delivery_options do ON o.delivery_option_id = do.delivery_id
      LEFT JOIN
        payment_methods pm ON o.payment_option_id = pm.payment_method_id
      LEFT JOIN
        order_tracking ot ON o.order_id = ot.order_id
      WHERE 
        o.order_id = ?
    `;

    sqldb.query(query, [orderId], (err, results) => {
      if (err) {
        console.error('Error fetching order details:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while fetching order details'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      return res.status(200).json({
        success: true,
        order: results[0]
      });
    });
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Process order shipping with tracking number
export const processOrderShipping = async (req, res) => {
  const { orderId, trackingNumber, employeeId } = req.body;
  
  if (!orderId || !trackingNumber || !employeeId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID, tracking number, and employee ID are required'
    });
  }
  
  try {
    // Begin transaction
    await new Promise((resolve, reject) => {
      sqldb.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 1. Check if the order exists and has the correct status
    const checkOrderQuery = `
      SELECT order_id, order_status 
      FROM orders 
      WHERE order_id = ? AND order_status = 'To be Shipped'
    `;
    
    const orderResult = await new Promise((resolve, reject) => {
      sqldb.query(checkOrderQuery, [orderId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (orderResult.length === 0) {
      throw new Error('Order not found or not in "To be Shipped" status');
    }
    
    // 2. Update the order status to "Shipped"
    const updateOrderQuery = `
      UPDATE orders 
      SET order_status = 'Shipped', updated_at = NOW() 
      WHERE order_id = ?
    `;
    
    await new Promise((resolve, reject) => {
      sqldb.query(updateOrderQuery, [orderId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // 3. Add entry to order_tracking table - FIXED to match schema
    const addTrackingQuery = `
      INSERT INTO order_tracking (
        order_id, 
        tracking_number, 
        employee_id
      ) VALUES (?, ?, ?)
    `;
    
    await new Promise((resolve, reject) => {
      sqldb.query(
        addTrackingQuery, 
        [orderId, trackingNumber, employeeId], 
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    // Commit the transaction
    await new Promise((resolve, reject) => {
      sqldb.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Order has been processed and marked as shipped'
    });
    
  } catch (error) {
    console.error('Error in processOrderShipping:', error);
    
    // Rollback transaction if there was an error
    try {
      await new Promise(resolve => {
        sqldb.rollback(() => {
          console.log('Transaction rolled back');
          resolve();
        });
      });
    } catch (rollbackErr) {
      console.error('Error during rollback:', rollbackErr);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during order processing'
    });
  }
};

// Update tracking number for a shipped order - FIXED
export const updateTrackingNumber = async (req, res) => {
  const { orderId, trackingNumber, employeeId } = req.body;
  
  if (!orderId || !trackingNumber || !employeeId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID, tracking number, and employee ID are required'
    });
  }
  
  try {
    // Begin transaction
    await new Promise((resolve, reject) => {
      sqldb.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Check if the order exists and is shipped
    const checkOrderQuery = `
      SELECT o.order_id, o.order_status, ot.tracking_id 
      FROM orders o
      LEFT JOIN order_tracking ot ON o.order_id = ot.order_id
      WHERE o.order_id = ? AND o.order_status = 'Shipped'
    `;
    
    const results = await new Promise((resolve, reject) => {
      sqldb.query(checkOrderQuery, [orderId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (results.length === 0) {
      throw new Error('Order not found or not in "Shipped" status');
    }
    
    const trackingId = results[0].tracking_id;
    
    if (!trackingId) {
      throw new Error('No tracking record found for this order');
    }
    
    // Update tracking number
    const updateTrackingQuery = `
      UPDATE order_tracking 
      SET tracking_number = ?, 
          updated_at = NOW()
      WHERE tracking_id = ?
    `;
    
    await new Promise((resolve, reject) => {
      sqldb.query(updateTrackingQuery, [trackingNumber, trackingId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // Commit the transaction
    await new Promise((resolve, reject) => {
      sqldb.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Tracking number updated successfully'
    });
    
  } catch (error) {
    console.error('Error in updateTrackingNumber:', error);
    
    // Rollback transaction
    try {
      await new Promise(resolve => {
        sqldb.rollback(() => {
          console.log('Transaction rolled back');
          resolve();
        });
      });
    } catch (rollbackErr) {
      console.error('Error during rollback:', rollbackErr);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};