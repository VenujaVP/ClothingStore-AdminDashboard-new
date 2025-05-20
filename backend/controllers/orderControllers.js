import sqldb from '../config/sqldb.js';

// Fixed placeOrder function with cart item removal
export const placeOrder = async (req, res) => {
  const { order, orderItems, fromCart } = req.body;
  
  if (!order || !orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order data. Order items are required.'
    });
  }

  try {
    // Generate unique order_item_id using timestamp
    const baseTimestamp = Math.floor(Date.now());
    
    // Debug what we're trying to insert
    console.log('Attempting to insert orders with data:', { order, orderItems });

    // Insert multiple order items, one per row in the orders table
    const orderInsertPromises = orderItems.map(async (item, index) => {
      // Generate unique order_item_id for each item
      const uniqueOrderItemId = baseTimestamp + index;
      
      return new Promise((resolve, reject) => {
        // Log the exact values being inserted
        console.log('Inserting order item with data:', {
          order_item_id: uniqueOrderItemId,
          customer_id: order.customer_id,
          address_id: order.address_id,
          delivery_option_id: order.deliveryOptionId,
          payment_option_id: order.paymentMethodId,
          payment_id: null,
          product_id: item.product_id,
          variation_id: item.variation_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          delivery_fee: order.delivery_fee,
          total_amount: item.item_total_price
        });

        sqldb.query(
          `INSERT INTO orders (
            order_item_id, customer_id, address_id, delivery_option_id, payment_option_id, 
            payment_id, product_id, variation_id, quantity, unit_price,
            total_price, delivery_fee, total_amount, order_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uniqueOrderItemId,
            order.customer_id, 
            order.address_id, 
            order.deliveryOptionId,
            order.paymentMethodId, 
            null, // payment_id will be updated after payment
            item.product_id,
            item.variation_id,
            item.quantity,
            item.unit_price,
            item.total_price,
            order.delivery_fee,
            item.item_total_price, 
            'Unpaid' // Default status for new orders
          ],
          (err, result) => {
            if (err) {
              console.error('SQL Error in placeOrder:', err);
              reject(err);
            } else {
              resolve({
                orderId: result.insertId,
                orderItemId: uniqueOrderItemId,
                productId: item.product_id,
                variationId: item.variation_id
              });
            }
          }
        );
      });
    });

    try {
      // Execute all inserts and collect order IDs
      const orderResults = await Promise.all(orderInsertPromises);
      const orderIds = orderResults.map(result => result.orderId);
      const orderItemIds = orderResults.map(result => result.orderItemId);
      
      console.log('Successfully inserted orders with IDs:', orderIds);
      
      // If the order came from the cart, remove the items from the cart
      if (fromCart) {
        try {
          // Remove items from cart after successful order placement
          const cartItemsToRemove = orderItems.map(item => ({
            productId: item.product_id,
            variationId: item.variation_id
          }));

          // Create placeholders for WHERE IN clause
          const placeholders = cartItemsToRemove.map(() => '(ProductID = ? AND VariationID = ?)').join(' OR ');
          
          // Flatten parameters array for SQL query
          const params = [];
          cartItemsToRemove.forEach(item => {
            params.push(item.productId, item.variationId);
          });
          
          // Add customer ID to params
          params.push(order.customer_id);
          
          // Execute deletion
          await new Promise((resolve, reject) => {
            sqldb.query(
              `DELETE FROM cart_items WHERE (${placeholders}) AND customerID = ?`,
              params,
              (err, result) => {
                if (err) {
                  console.error('Failed to remove items from cart:', err);
                  // Don't reject, just log the error
                  resolve();
                } else {
                  console.log(`Removed ${result.affectedRows} items from cart`);
                  resolve();
                }
              }
            );
          });
        } catch (cartError) {
          console.error('Error removing items from cart:', cartError);
          // Don't fail the entire order just because cart cleanup failed
        }
      }

      // Return success with all generated order IDs
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        orderId: orderIds[0], // First order ID for compatibility
        orderIds: orderIds,   // All order IDs (one per item)
        orderItemIds: orderItemIds  // All order item IDs (one per item)
      });
    } catch (promiseError) {
      console.error('Error in order insertion promises:', promiseError);
      throw promiseError;
    }

  } catch (error) {
    console.error('Error placing order:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.sqlMessage || error.message
    });
  }
};