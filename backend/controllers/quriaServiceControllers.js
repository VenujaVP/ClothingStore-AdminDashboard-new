import sqldb from '../config/sqldb.js';

// Get all orders with "Shipped" status
export const getShippedOrders = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.order_status,
        o.created_at AS order_date,
        a.contact_name AS recipient_name,
        a.mobile_number AS recipient_phone,
        a.street_address,
        a.apt_suite_unit,
        a.province,
        a.district,
        a.zip_code,
        CONCAT(
          a.street_address,
          IF(a.apt_suite_unit IS NOT NULL AND a.apt_suite_unit != '', CONCAT(', ', a.apt_suite_unit), ''),
          ', ', a.district, ', ', a.province, ' ', a.zip_code
        ) AS full_address,
        ot.tracking_number,
        ot.tracking_id,
        ot.created_at AS shipping_date
      FROM 
        orders o
      JOIN 
        addresses a ON o.address_id = a.address_id
      LEFT JOIN 
        order_tracking ot ON o.order_id = ot.order_id
      WHERE 
        o.order_status = 'Shipped'
      ORDER BY 
        o.created_at DESC
    `;

    sqldb.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching shipped orders:', err);
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
    console.error('Error in getShippedOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all orders with "Delivered" status
export const getDeliveredOrders = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.order_status,
        o.created_at AS order_date,
        a.contact_name AS recipient_name,
        a.mobile_number AS recipient_phone,
        a.street_address,
        a.apt_suite_unit,
        a.province,
        a.district,
        a.zip_code,
        CONCAT(
          a.street_address,
          IF(a.apt_suite_unit IS NOT NULL AND a.apt_suite_unit != '', CONCAT(', ', a.apt_suite_unit), ''),
          ', ', a.district, ', ', a.province, ' ', a.zip_code
        ) AS full_address,
        ot.tracking_number,
        ot.delivery_date,
        e.USERNAME AS employee_name,
        ot.created_at AS shipping_date
      FROM 
        orders o
      JOIN 
        addresses a ON o.address_id = a.address_id
      LEFT JOIN 
        order_tracking ot ON o.order_id = ot.order_id
      LEFT JOIN
        Polocity_Panel_Users e ON ot.employee_id = e.ID
      WHERE 
        o.order_status = 'Delivered'
      ORDER BY 
        ot.delivery_date DESC, ot.updated_at DESC
    `;

    sqldb.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching delivered orders:', err);
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
    console.error('Error in getDeliveredOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Mark order as delivered (update status from "Shipped" to "Delivered")
export const markOrderAsDelivered = async (req, res) => {
  const { orderId } = req.params;
  
  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required'
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
    
    // 1. Check if the order exists and has "Shipped" status
    const checkOrderQuery = `
      SELECT order_id, order_status 
      FROM orders 
      WHERE order_id = ? AND order_status = 'Shipped'
    `;
    
    const orderResult = await new Promise((resolve, reject) => {
      sqldb.query(checkOrderQuery, [orderId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (orderResult.length === 0) {
      throw new Error('Order not found or not in "Shipped" status');
    }
    
    // 2. Update the order status to "Delivered"
    const updateOrderQuery = `
      UPDATE orders 
      SET order_status = 'Delivered', updated_at = NOW() 
      WHERE order_id = ?
    `;
    
    await new Promise((resolve, reject) => {
      sqldb.query(updateOrderQuery, [orderId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // 3. Update ONLY the delivery_date in the order_tracking record
    const updateTrackingQuery = `
      UPDATE order_tracking 
      SET 
        delivery_date = CURDATE(),
        updated_at = NOW()
      WHERE order_id = ?
    `;
    
    await new Promise((resolve, reject) => {
      sqldb.query(updateTrackingQuery, [orderId], (err, result) => {
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
      message: 'Order has been marked as delivered'
    });
    
  } catch (error) {
    console.error('Error in markOrderAsDelivered:', error);
    
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
      message: error.message || 'Server error during order update'
    });
  }
};