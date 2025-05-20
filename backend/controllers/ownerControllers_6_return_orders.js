// controllers/ownerControllers_6_return_orders.js

import sqldb from '../config/sqldb.js';

// Get all orders with status "Processing" (pending refunds)
export const getPendingRefunds = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.customer_id,
        o.total_amount,
        o.total_price,
        o.delivery_fee,
        o.order_status,
        o.created_at AS order_date,
        o.updated_at AS last_updated,
        
        c.NAME AS customer_name,
        c.EMAIL AS customer_email,
        c.PHONE_NUM AS customer_phone,
        
        p.ProductName AS product_name,
        p.ProductID,
        
        s.SizeValue AS size,
        col.ColorValue AS color,
        
        a.contact_name AS recipient_name,
        a.mobile_number AS recipient_phone,
        a.street_address,
        a.district,
        a.province,
        
        pay.payment_method_id,
        pay.payment_status,
        pay.transaction_reference,
        pay.payment_date,
        
        pm.name AS payment_method_name,
        pm.is_online_payment
      FROM 
        orders o
      JOIN 
        customers c ON o.customer_id = c.ID
      JOIN 
        product_table p ON o.product_id = p.ProductID
      JOIN 
        product_variations pv ON o.variation_id = pv.VariationID
      JOIN 
        sizes s ON pv.SizeID = s.SizeID
      JOIN 
        colors col ON pv.ColorID = col.ColorID
      JOIN 
        addresses a ON o.address_id = a.address_id
      LEFT JOIN 
        payments pay ON o.payment_id = pay.payment_id
      LEFT JOIN 
        payment_methods pm ON pay.payment_method_id = pm.payment_method_id
      WHERE 
        o.order_status = 'Processing'
      ORDER BY 
        o.updated_at DESC
    `;

    sqldb.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching pending refunds:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching pending refunds',
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        pendingRefunds: results,
        count: results.length
      });
    });
  } catch (error) {
    console.error('Error in getPendingRefunds controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all orders with status "Refunded" (completed refunds)
export const getCompletedRefunds = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.customer_id,
        o.total_amount,
        o.total_price,
        o.delivery_fee,
        o.order_status,
        o.created_at AS order_date,
        o.updated_at AS last_updated,
        
        c.NAME AS customer_name,
        c.EMAIL AS customer_email,
        c.PHONE_NUM AS customer_phone,
        
        p.ProductName AS product_name,
        p.ProductID,
        
        s.SizeValue AS size,
        col.ColorValue AS color,
        
        a.contact_name AS recipient_name,
        a.mobile_number AS recipient_phone,
        a.street_address,
        a.district,
        a.province,
        
        pay.payment_method_id,
        pay.payment_status,
        pay.transaction_reference,
        pay.payment_date,
        
        pm.name AS payment_method_name,
        pm.is_online_payment
      FROM 
        orders o
      JOIN 
        customers c ON o.customer_id = c.ID
      JOIN 
        product_table p ON o.product_id = p.ProductID
      JOIN 
        product_variations pv ON o.variation_id = pv.VariationID
      JOIN 
        sizes s ON pv.SizeID = s.SizeID
      JOIN 
        colors col ON pv.ColorID = col.ColorID
      JOIN 
        addresses a ON o.address_id = a.address_id
      LEFT JOIN 
        payments pay ON o.payment_id = pay.payment_id
      LEFT JOIN 
        payment_methods pm ON pay.payment_method_id = pm.payment_method_id
      WHERE 
        o.order_status = 'Refunded'
      ORDER BY 
        o.updated_at DESC
    `;

    sqldb.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching completed refunds:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching completed refunds',
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        completedRefunds: results,
        count: results.length
      });
    });
  } catch (error) {
    console.error('Error in getCompletedRefunds controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Process refund for an order (change status from Processing to Refunded)
export const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundNotes, processedById } = req.body;
    
    // First update order status
    const updateOrderQuery = `
      UPDATE orders 
      SET order_status = 'Refunded', updated_at = NOW() 
      WHERE order_id = ? AND order_status = 'Processing'
    `;

    sqldb.query(updateOrderQuery, [orderId], (err, orderResult) => {
      if (err) {
        console.error('Error processing refund:', err);
        return res.status(500).json({
          success: false,
          message: 'Error processing refund',
          error: err.message
        });
      }

      if (orderResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or not in Processing status'
        });
      }

      // Then update payment status
      const updatePaymentQuery = `
        UPDATE payments p
        JOIN orders o ON p.payment_id = o.payment_id
        SET p.payment_status = 'refunded', p.updated_at = NOW()
        WHERE o.order_id = ?
      `;

      sqldb.query(updatePaymentQuery, [orderId], (err, paymentResult) => {
        if (err) {
          console.error('Error updating payment status:', err);
          // Don't return error here, we already updated the order
        }

        // Get the updated order details
        const getOrderQuery = `
          SELECT 
            o.order_id,
            o.order_item_id,
            o.order_status,
            o.updated_at AS refund_date,
            p.ProductName,
            c.NAME AS customer_name,
            o.total_amount
          FROM 
            orders o
          JOIN 
            product_table p ON o.product_id = p.ProductID
          JOIN 
            customers c ON o.customer_id = c.ID
          WHERE 
            o.order_id = ?
        `;

        sqldb.query(getOrderQuery, [orderId], (err, orderDetails) => {
          if (err) {
            console.error('Error fetching updated order details:', err);
            return res.status(200).json({
              success: true,
              message: 'Refund processed successfully',
              orderInfo: { order_id: orderId }
            });
          }

          res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            orderInfo: orderDetails[0] || { order_id: orderId }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in processRefund controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get refund summary stats
export const getRefundStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN order_status = 'Processing' THEN 1 END) AS pending_count,
        COUNT(CASE WHEN order_status = 'Refunded' THEN 1 END) AS completed_count,
        SUM(CASE WHEN order_status = 'Processing' THEN total_amount ELSE 0 END) AS pending_amount,
        SUM(CASE WHEN order_status = 'Refunded' THEN total_amount ELSE 0 END) AS refunded_amount
      FROM 
        orders
      WHERE 
        order_status IN ('Processing', 'Refunded')
    `;

    sqldb.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching refund stats:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching refund statistics',
          error: err.message
        });
      }

      res.status(200).json({
        success: true,
        stats: results[0]
      });
    });
  } catch (error) {
    console.error('Error in getRefundStats controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};