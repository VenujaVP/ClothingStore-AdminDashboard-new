//controller/paymentController.js

import Stripe from 'stripe';
import sqldb from '../config/sqldb.js';
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/mongodb.js';

dotenv.config();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a payment intent to begin payment process
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, orderIds, paymentMethodId } = req.body;

    if (!amount || !currency || !orderIds || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    console.log('Creating payment intent:', { amount, currency, orderIds, paymentMethodId });

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency,
      metadata: {
        orderIds: JSON.stringify(orderIds),
        paymentMethodId
      }
    });

    // Create a pending payment record in the database
    const insertPaymentQuery = `
      INSERT INTO payments (
        payment_method_id, amount, payment_intent_id, payment_status
      ) VALUES (?, ?, ?, ?)
    `;

    // Ensure proper type conversion for database - use the provided payment_method_id
    // This should match payment_methods.payment_method_id in your database
    const methodId = parseInt(paymentMethodId, 10);
    const decimalAmount = parseFloat((amount / 100).toFixed(2)); // Convert cents to dollars/LKR with 2 decimal places

    sqldb.query(
      insertPaymentQuery,
      [methodId, decimalAmount, paymentIntent.id, 'pending'],
      (err, result) => {
        if (err) {
          console.error('Error creating payment record:', err);
          // Continue despite DB error since we can recover later
        } else {
          console.log('Created payment record with ID:', result.insertId);
        }
      }
    );

    // Return client secret to allow client-side confirmation
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

// Update payment status after payment is processed
export const updatePaymentStatus = async (req, res) => {
  // Use this to track if we need to rollback
  let transactionStarted = false;

  try {
    const { orderIds, paymentId, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment update data'
      });
    }

    console.log('Updating payment status:', { orderIds, paymentId, status });

    // Begin transaction
    transactionStarted = true;
    await new Promise((resolve, reject) => {
      sqldb.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. For completed payments, check stock availability first
    if (status === 'completed') {
      // Get all order details to check stock levels
      const stockCheckPromises = orderIds.map(async (orderId) => {
        // Get order details to know which variation and quantity to check
        const orderDetailsQuery = `
          SELECT o.order_id, o.variation_id, o.quantity, pv.units as available_stock
          FROM orders o
          JOIN product_variations pv ON o.variation_id = pv.VariationID
          WHERE o.order_id = ?
        `;
        
        const orderDetails = await new Promise((resolve, reject) => {
          sqldb.query(orderDetailsQuery, [orderId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          });
        });

        if (!orderDetails) {
          return { 
            orderId, 
            hasStock: false, 
            message: `Order not found: ${orderId}`
          };
        }

        // Check if we have enough stock
        const hasEnoughStock = orderDetails.available_stock >= orderDetails.quantity;
        
        return {
          orderId,
          variationId: orderDetails.variation_id,
          requestedQuantity: orderDetails.quantity,
          availableStock: orderDetails.available_stock,
          hasStock: hasEnoughStock,
          message: hasEnoughStock 
            ? 'Stock available' 
            : `Not enough stock: requested ${orderDetails.quantity}, available ${orderDetails.available_stock}`
        };
      });

      // Wait for all stock checks to complete
      const stockResults = await Promise.all(stockCheckPromises);
      
      // Check if any product has insufficient stock
      const insufficientStockItems = stockResults.filter(item => !item.hasStock);
      
      if (insufficientStockItems.length > 0) {
        console.log('Insufficient stock for some items:', insufficientStockItems);
        
        // Update all affected orders to Failed status
        for (const item of insufficientStockItems) {
          const updateOrderQuery = `
            UPDATE orders 
            SET order_status = 'Failed', 
                updated_at = NOW()
            WHERE order_id = ?
          `;
          
          await new Promise((resolve, reject) => {
            sqldb.query(updateOrderQuery, [item.orderId], (err) => {
              if (err) reject(err);
              else {
                console.log(`Updated order ${item.orderId} to Failed due to insufficient stock`);
                resolve();
              }
            });
          });
        }
        
        // If there's a payment ID, mark payment as failed
        if (paymentId) {
          // Get payment method ID from the first order
          const orderQuery = `
            SELECT payment_option_id FROM orders 
            WHERE order_id = ? LIMIT 1
          `;
          
          const orderResults = await new Promise((resolve, reject) => {
            sqldb.query(orderQuery, [orderIds[0]], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });

          if (orderResults.length === 0) {
            throw new Error(`Order not found with ID: ${orderIds[0]}`);
          }

          const order = orderResults[0];
          
          // Check if payment record exists
          const paymentQuery = `
            SELECT payment_id FROM payments 
            WHERE payment_intent_id = ?
          `;

          const paymentResults = await new Promise((resolve, reject) => {
            sqldb.query(paymentQuery, [paymentId], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });

          if (paymentResults.length === 0) {
            // Get payment amount from Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
            
            // Calculate amount in database format (dollars/LKR with 2 decimal places)
            const amount = parseFloat((paymentIntent.amount / 100).toFixed(2));
            
            // Insert new payment record as failed
            const insertQuery = `
              INSERT INTO payments (
                payment_method_id, amount, payment_intent_id, 
                payment_status, payment_date
              ) VALUES (?, ?, ?, 'failed', NOW())
            `;
            
            await new Promise((resolve, reject) => {
              sqldb.query(
                insertQuery, 
                [order.payment_option_id, amount, paymentId], 
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          } else {
            // Update existing payment record as failed
            const updatePaymentQuery = `
              UPDATE payments 
              SET payment_status = 'failed', updated_at = NOW()
              WHERE payment_intent_id = ?
            `;
            
            await new Promise((resolve, reject) => {
              sqldb.query(
                updatePaymentQuery, 
                [paymentId], 
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }
            
          try {
            // Attempt to cancel/refund the payment in Stripe
            await stripe.paymentIntents.cancel(paymentId);
          } catch (stripeError) {
            console.error('Error canceling payment in Stripe:', stripeError);
            // Continue with local database updates even if Stripe cancel fails
          }
        }
        
        // Commit transaction for failed orders
        await new Promise((resolve, reject) => {
          sqldb.commit(err => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Return error response
        return res.status(400).json({
          success: false,
          message: 'Payment cannot be completed due to insufficient stock',
          insufficientStockItems
        });
      }
      
      // If all stock is available, continue with payment processing
      console.log('Stock is available for all items, proceeding with payment');
    }

    // 2. Update payment record if we have a payment ID
    if (paymentId) {
      // First check if payment record exists
      const paymentQuery = `
        SELECT payment_id FROM payments 
        WHERE payment_intent_id = ?
      `;

      const paymentResults = await new Promise((resolve, reject) => {
        sqldb.query(paymentQuery, [paymentId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      let paymentRecordId;

      // If no existing payment record found with this intent ID, create one
      if (paymentResults.length === 0) {
        // Get payment method ID from the first order
        const orderQuery = `
          SELECT payment_option_id FROM orders 
          WHERE order_id = ? LIMIT 1
        `;
        
        const orderResults = await new Promise((resolve, reject) => {
          sqldb.query(orderQuery, [orderIds[0]], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (orderResults.length === 0) {
          throw new Error(`Order not found with ID: ${orderIds[0]}`);
        }

        const order = orderResults[0];

        // Get payment amount from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        
        // Calculate amount in database format (dollars/LKR with 2 decimal places)
        const amount = parseFloat((paymentIntent.amount / 100).toFixed(2));
        
        // Insert new payment record
        const insertQuery = `
          INSERT INTO payments (
            payment_method_id, amount, payment_intent_id, 
            payment_status, payment_date
          ) VALUES (?, ?, ?, ?, NOW())
        `;
        
        const insertResult = await new Promise((resolve, reject) => {
          sqldb.query(
            insertQuery, 
            [
              order.payment_option_id, 
              amount, 
              paymentId, 
              status === 'completed' ? 'completed' : 'failed'
            ], 
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        
        paymentRecordId = insertResult.insertId;
        console.log('Created new payment record:', paymentRecordId);
      } else {
        // Update existing payment record
        paymentRecordId = paymentResults[0].payment_id;
        
        const updatePaymentQuery = `
          UPDATE payments 
          SET payment_status = ?, payment_date = NOW(), updated_at = NOW()
          WHERE payment_id = ?
        `;
        
        await new Promise((resolve, reject) => {
          sqldb.query(
            updatePaymentQuery, 
            [status === 'completed' ? 'completed' : 'failed', paymentRecordId], 
            (err, result) => {
              if (err) reject(err);
              else {
                console.log('Updated payment record:', paymentRecordId);
                resolve(result);
              }
            }
          );
        });
      }

      // 3. Update all orders with the payment ID and new status
      const updateOrderStatus = status === 'completed' ? 'To be Shipped' : 'Failed';
      
      // We need to use separate queries for each order ID due to MySQL's limitations
      for (const orderId of orderIds) {
        const updateOrderQuery = `
          UPDATE orders 
          SET payment_id = ?, order_status = ?, updated_at = NOW()
          WHERE order_id = ?
        `;
        
        await new Promise((resolve, reject) => {
          sqldb.query(updateOrderQuery, [paymentRecordId, updateOrderStatus, orderId], (err, result) => {
            if (err) reject(err);
            else {
              console.log(`Updated order ${orderId} with payment ${paymentRecordId}`);
              resolve(result);
            }
          });
        });

        // 4. UPDATE STOCK LEVELS ONLY IF PAYMENT SUCCESSFUL
        if (status === 'completed') {
          // Get order details to know which variation and quantity to update
          const orderDetailsQuery = `
            SELECT variation_id, quantity 
            FROM orders 
            WHERE order_id = ?
          `;
          
          const orderDetails = await new Promise((resolve, reject) => {
            sqldb.query(orderDetailsQuery, [orderId], (err, results) => {
              if (err) reject(err);
              else resolve(results[0]);
            });
          });

          if (!orderDetails) {
            throw new Error(`Could not find order details for order ID: ${orderId}`);
          }

          // Convert quantity to a proper number and log for debugging
          const quantityToReduce = parseInt(orderDetails.quantity, 10);
          console.log(`Order ${orderId} quantity data:`, {
            originalQuantity: orderDetails.quantity,
            parsedQuantity: quantityToReduce,
            type: typeof quantityToReduce
          });

          // Make sure we have a valid quantity
          if (isNaN(quantityToReduce) || quantityToReduce <= 0) {
            console.warn(`Skipping stock update for order ${orderId}: Invalid quantity ${orderDetails.quantity}`);
            continue; // Skip to next order
          }

          // Reduce stock count for this variation with proper numeric value
          const updateStockQuery = `
            UPDATE product_variations 
            SET units = GREATEST(units - ?, 0)
            WHERE VariationID = ?
          `;
          
          const updateResult = await new Promise((resolve, reject) => {
            sqldb.query(
              updateStockQuery, 
              [quantityToReduce, orderDetails.variation_id], 
              (err, result) => {
                if (err) reject(err);
                else {
                  console.log(`Updated stock for variation ${orderDetails.variation_id}:`);
                  console.log(`- Reduced by ${quantityToReduce} units`);
                  console.log(`- Affected rows: ${result.affectedRows}`);
                  resolve(result);
                }
              }
            );
          });

          // Verify the update worked
          if (updateResult.affectedRows === 0) {
            console.warn(`Warning: Stock update for variation ${orderDetails.variation_id} didn't affect any rows`);
          }
        }
      }
      
    } else {
      // Just update order status (for failed payments without ID)
      const updateOrderStatus = status === 'completed' ? 'To be Shipped' : 'Failed';
      
      // Update each order individually
      for (const orderId of orderIds) {
        const updateOrderQuery = `
          UPDATE orders 
          SET order_status = ?, updated_at = NOW()
          WHERE order_id = ?
        `;
        
        await new Promise((resolve, reject) => {
          sqldb.query(updateOrderQuery, [updateOrderStatus, orderId], (err, result) => {
            if (err) reject(err);
            else {
              console.log(`Updated status of order ${orderId} to ${updateOrderStatus}`);
              resolve(result);
            }
          });
        });
      }
    }

    // Commit transaction
    await new Promise((resolve, reject) => {
      sqldb.commit(err => {
        if (err) reject(err);
        else {
          console.log('Transaction committed successfully');
          resolve();
        }
      });
    });

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    
    // Rollback transaction if it was started
    if (transactionStarted) {
      try {
        await new Promise((resolve) => {
          sqldb.rollback(() => {
            console.log('Transaction rolled back due to error');
            resolve();
          });
        });
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

// Verify payment status directly from Stripe
export const verifyPaymentStatus = async (req, res) => {
  let transactionStarted = false;
  
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Retrieved payment intent:', paymentIntent.id, 'Status:', paymentIntent.status);

    // Extract order IDs from metadata
    let orderIds = [];
    let paymentMethodId;
    
    try {
      orderIds = JSON.parse(paymentIntent.metadata.orderIds || '[]');
      paymentMethodId = parseInt(paymentIntent.metadata.paymentMethodId, 10);
    } catch (e) {
      console.error('Failed to parse metadata:', e);
    }

    // If payment succeeded and we have order IDs, update our database
    if (paymentIntent.status === 'succeeded' && orderIds.length > 0) {
      // Start transaction
      transactionStarted = true;
      await new Promise((resolve, reject) => {
        sqldb.beginTransaction(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // 1. Check stock availability first
      const stockCheckPromises = orderIds.map(async (orderId) => {
        // Get order details to know which variation and quantity to check
        const orderDetailsQuery = `
          SELECT o.order_id, o.variation_id, o.quantity, pv.units as available_stock
          FROM orders o
          JOIN product_variations pv ON o.variation_id = pv.VariationID
          WHERE o.order_id = ?
        `;
        
        const orderDetails = await new Promise((resolve, reject) => {
          sqldb.query(orderDetailsQuery, [orderId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          });
        });

        if (!orderDetails) {
          return { 
            orderId, 
            hasStock: false, 
            message: `Order not found: ${orderId}`
          };
        }

        // Check if we have enough stock
        const hasEnoughStock = orderDetails.available_stock >= orderDetails.quantity;
        
        return {
          orderId,
          variationId: orderDetails.variation_id,
          requestedQuantity: orderDetails.quantity,
          availableStock: orderDetails.available_stock,
          hasStock: hasEnoughStock,
          message: hasEnoughStock 
            ? 'Stock available' 
            : `Not enough stock: requested ${orderDetails.quantity}, available ${orderDetails.available_stock}`
        };
      });

      // Wait for all stock checks to complete
      const stockResults = await Promise.all(stockCheckPromises);
      
      // Check if any product has insufficient stock
      const insufficientStockItems = stockResults.filter(item => !item.hasStock);
      
      if (insufficientStockItems.length > 0) {
        console.log('Insufficient stock for some items:', insufficientStockItems);
        
        // Update all affected orders to Failed status
        for (const item of insufficientStockItems) {
          const updateOrderQuery = `
            UPDATE orders 
            SET order_status = 'Failed', 
                updated_at = NOW()
            WHERE order_id = ?
          `;
          
          await new Promise((resolve, reject) => {
            sqldb.query(updateOrderQuery, [item.orderId], (err) => {
              if (err) reject(err);
              else {
                console.log(`Updated order ${item.orderId} to Failed due to insufficient stock`);
                resolve();
              }
            });
          });
        }
        
        // If all orders failed, mark payment as failed
        if (insufficientStockItems.length === orderIds.length) {
          // Create or update payment record as failed
          const paymentQuery = `
            SELECT payment_id FROM payments 
            WHERE payment_intent_id = ?
          `;
          
          const paymentResults = await new Promise((resolve, reject) => {
            sqldb.query(paymentQuery, [paymentIntentId], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (paymentResults.length === 0) {
            // Create new payment record as failed
            const amount = parseFloat((paymentIntent.amount / 100).toFixed(2));
            
            const insertQuery = `
              INSERT INTO payments (
                payment_method_id, amount, payment_intent_id, 
                payment_status, payment_date
              ) VALUES (?, ?, ?, 'failed', NOW())
            `;
            
            await new Promise((resolve, reject) => {
              sqldb.query(
                insertQuery, 
                [paymentMethodId, amount, paymentIntentId], 
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          } else {
            // Update existing payment as failed
            const updateQuery = `
              UPDATE payments 
              SET payment_status = 'failed', updated_at = NOW()
              WHERE payment_intent_id = ?
            `;
            
            await new Promise((resolve, reject) => {
              sqldb.query(
                updateQuery, 
                [paymentIntentId], 
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }
          
          try {
            // Attempt to refund the payment in Stripe
            await stripe.refunds.create({
              payment_intent: paymentIntentId,
            });
          } catch (stripeError) {
            console.error('Error refunding payment in Stripe:', stripeError);
          }
        }
        
        // Commit transaction for failed orders
        await new Promise((resolve, reject) => {
          sqldb.commit(err => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Return partial success
        return res.status(200).json({
          success: true,
          partialSuccess: true, 
          paymentStatus: paymentIntent.status,
          message: 'Some orders could not be fulfilled due to insufficient stock',
          insufficientStockItems
        });
      }
      
      // Check if payment record exists
      const paymentQuery = `
        SELECT payment_id FROM payments 
        WHERE payment_intent_id = ?
      `;
      
      const paymentResults = await new Promise((resolve, reject) => {
        sqldb.query(paymentQuery, [paymentIntentId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      let paymentId;
      
      if (paymentResults.length === 0) {
        // Create new payment record
        const amount = parseFloat((paymentIntent.amount / 100).toFixed(2));
        
        const insertQuery = `
          INSERT INTO payments (
            payment_method_id, amount, payment_intent_id, 
            payment_status, payment_date
          ) VALUES (?, ?, ?, 'completed', NOW())
        `;
        
        const insertResult = await new Promise((resolve, reject) => {
          sqldb.query(
            insertQuery, 
            [paymentMethodId, amount, paymentIntentId], 
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        
        paymentId = insertResult.insertId;
        console.log('Created new payment record during verification:', paymentId);
      } else {
        // Update existing payment
        paymentId = paymentResults[0].payment_id;
        
        const updateQuery = `
          UPDATE payments 
          SET payment_status = 'completed', payment_date = COALESCE(payment_date, NOW())
          WHERE payment_id = ?
        `;
        
        await new Promise((resolve, reject) => {
          sqldb.query(updateQuery, [paymentId], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log('Updated existing payment record during verification:', paymentId);
      }
      
      // Update each order
      for (const orderId of orderIds) {
        const updateOrderQuery = `
          UPDATE orders 
          SET payment_id = ?, order_status = 'To be Shipped'
          WHERE order_id = ?
        `;
        
        await new Promise((resolve, reject) => {
          sqldb.query(updateOrderQuery, [paymentId, orderId], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log(`Updated order ${orderId} with payment ${paymentId} during verification`);
        
        // Add stock update for verified payments
        // Get order details for this order
        const orderDetailsQuery = `
          SELECT variation_id, quantity 
          FROM orders 
          WHERE order_id = ?
        `;
        
        const orderDetails = await new Promise((resolve, reject) => {
          sqldb.query(orderDetailsQuery, [orderId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          });
        });

        if (orderDetails) {
          // Update stock for this variation
          const updateStockQuery = `
            UPDATE product_variations 
            SET units = GREATEST(units - ?, 0)
            WHERE VariationID = ?
          `;
          
          await new Promise((resolve, reject) => {
            sqldb.query(
              updateStockQuery, 
              [orderDetails.quantity, orderDetails.variation_id], 
              (err, result) => {
                if (err) reject(err);
                else {
                  console.log(`Updated stock for variation ${orderDetails.variation_id}, reduced by ${orderDetails.quantity}`);
                  resolve(result);
                }
              }
            );
          });
        }
      }
      
      // Commit transaction
      await new Promise((resolve, reject) => {
        sqldb.commit(err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.status(200).json({
      success: true,
      paymentStatus: paymentIntent.status
    });
  } catch (error) {
    console.error('Error verifying payment status:', error);
    
    // Rollback if transaction was started
    if (transactionStarted) {
      try {
        await new Promise((resolve) => {
          sqldb.rollback(() => {
            console.log('Verification transaction rolled back due to error');
            resolve();
          });
        });
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to verify payment status',
      error: error.message
    });
  }
};

// Get payment details by payment ID
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const query = `
      SELECT p.*, pm.name as payment_method_name
      FROM payments p
      JOIN payment_methods pm ON p.payment_method_id = pm.payment_method_id
      WHERE p.payment_id = ?
    `;

    sqldb.query(query, [paymentId], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve payment details',
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.status(200).json({
        success: true,
        payment: results[0]
      });
    });
  } catch (error) {
    console.error('Error retrieving payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment details',
      error: error.message
    });
  }
};

// Update order status for Cash on Delivery orders
export const updateCashOnDeliveryOrder = async (req, res) => {
  let transactionStarted = false;
  
  try {
    const { orderIds, paymentMethodId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data'
      });
    }

    console.log('Processing COD order:', { orderIds, paymentMethodId });

    // Begin transaction
    transactionStarted = true;
    await new Promise((resolve, reject) => {
      sqldb.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create a pending payment record for COD
    const insertPaymentQuery = `
      INSERT INTO payments (
        payment_method_id, 
        amount, 
        payment_status, 
        transaction_reference
      ) 
      SELECT 
        ?, 
        SUM(total_amount), 
        'pending', 
        CONCAT('COD-', NOW())
      FROM orders 
      WHERE order_id IN (?)
    `;

    const paymentResult = await new Promise((resolve, reject) => {
      sqldb.query(
        insertPaymentQuery,
        [parseInt(paymentMethodId, 10), orderIds],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const paymentId = paymentResult.insertId;
    console.log('Created COD payment record with ID:', paymentId);

    // Update all orders with payment ID and change status to "To be Shipped"
    for (const orderId of orderIds) {
      const updateOrderQuery = `
        UPDATE orders 
        SET payment_id = ?, 
            order_status = 'To be Shipped', 
            updated_at = NOW()
        WHERE order_id = ?
      `;
      
      await new Promise((resolve, reject) => {
        sqldb.query(
          updateOrderQuery,
          [paymentId, orderId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log(`Updated COD order ${orderId} with payment ${paymentId}`);
      
      // For COD orders, also update stock - we consider them "paid" once COD is set up
      const orderDetailsQuery = `
        SELECT variation_id, quantity 
        FROM orders 
        WHERE order_id = ?
      `;
      
      const orderDetails = await new Promise((resolve, reject) => {
        sqldb.query(orderDetailsQuery, [orderId], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

      if (orderDetails) {
        // Update stock for this variation
        const updateStockQuery = `
          UPDATE product_variations 
          SET units = GREATEST(units - ?, 0)
          WHERE VariationID = ?
        `;
        
        await new Promise((resolve, reject) => {
          sqldb.query(
            updateStockQuery, 
            [orderDetails.quantity, orderDetails.variation_id], 
            (err, result) => {
              if (err) reject(err);
              else {
                console.log(`Updated stock for COD order: variation ${orderDetails.variation_id}, reduced by ${orderDetails.quantity}`);
                resolve(result);
              }
            }
          );
        });
      }
    }

    // Commit transaction
    await new Promise((resolve, reject) => {
      sqldb.commit(err => {
        if (err) reject(err);
        else {
          console.log('COD transaction committed successfully');
          resolve();
        }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Cash on Delivery order processed successfully',
      paymentId: paymentId
    });
  } catch (error) {
    console.error('COD order processing error:', error);
    
    // Rollback transaction if it was started
    if (transactionStarted) {
      try {
        await new Promise((resolve) => {
          sqldb.rollback(() => {
            console.log('Transaction rolled back due to error');
            resolve();
          });
        });
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process Cash on Delivery order',
      error: error.message
    });
  }
};

// Updated getOrderDetails function that correctly works with your database schema and includes images
export const getOrderDetails = async (req, res) => {
  try {
    const { orderIds } = req.query;
    
    if (!orderIds) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs required'
      });
    }
    
    // Parse comma-separated IDs
    const ids = orderIds.split(',').map(id => parseInt(id.trim(), 10));
    
    // Get order items with proper joins to get size and color values
    const orderItemsQuery = `
      SELECT 
        o.order_id,
        o.order_item_id,
        p.ProductID as product_id,
        p.ProductName as productName,
        s.SizeValue as size,
        c.ColorValue as color,
        o.quantity,
        o.unit_price as unitPrice,
        o.total_price as totalPrice
      FROM orders o
      JOIN product_table p ON o.product_id = p.ProductID
      JOIN product_variations pv ON o.variation_id = pv.VariationID
      JOIN sizes s ON pv.SizeID = s.SizeID
      LEFT JOIN colors c ON pv.ColorID = c.ColorID
      WHERE o.order_id IN (?)
    `;
    
    const orderItems = await new Promise((resolve, reject) => {
      sqldb.query(orderItemsQuery, [ids], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    // Get order summary data
    const orderSummaryQuery = `
      SELECT 
        o.order_id,
        o.order_item_id,
        o.customer_id,
        o.total_price,
        o.delivery_fee,
        o.total_amount,
        o.order_status,
        o.created_at,
        
        pm.payment_method_id,
        pm.name as payment_method_name,
        pm.is_online_payment,
        
        p.payment_id,
        p.payment_status,
        p.payment_intent_id,
        p.transaction_reference,
        
        do.delivery_id,
        do.name as delivery_name,
        do.estimated_days,
        do.cost as delivery_cost,
        
        a.address_id,
        a.contact_name,
        a.street_address,
        a.apt_suite_unit,
        a.district,
        a.province,
        a.zip_code,
        a.mobile_number
      FROM orders o
      JOIN payment_methods pm ON o.payment_option_id = pm.payment_method_id
      LEFT JOIN payments p ON o.payment_id = p.payment_id
      JOIN delivery_options do ON o.delivery_option_id = do.delivery_id
      JOIN addresses a ON o.address_id = a.address_id
      WHERE o.order_id = ?
      LIMIT 1
    `;
    
    // Use the first order ID to get summary info
    const orderSummary = await new Promise((resolve, reject) => {
      sqldb.query(orderSummaryQuery, [ids[0]], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
    
    if (!orderSummary) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Calculate total amount for all orders
    let totalAmount = 0;
    if (ids.length > 1) {
      const totalQuery = `
        SELECT SUM(total_amount) as total
        FROM orders
        WHERE order_id IN (?)
      `;
      
      const totalResult = await new Promise((resolve, reject) => {
        sqldb.query(totalQuery, [ids], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });
      
      totalAmount = parseFloat(totalResult.total || 0);
    } else {
      totalAmount = parseFloat(orderSummary.total_amount || 0);
    }

    // Extract product IDs for image fetching
    const productIds = orderItems.map(item => item.product_id);
    
    let productImagesMap = {};
    
    try {
      // Connect to MongoDB to fetch images
      const { db } = await connectToDatabase();
      const productsCollection = db.collection('products');
      
      // Fetch images for all products in one query
      const productsWithImages = await productsCollection.find(
        { _id: { $in: productIds } },
        { projection: { _id: 1, images: 1 } } // Only fetch _id and images fields
      ).toArray();
      
      // Create a map of productId to its images for quick lookup
      productsWithImages.forEach(product => {
        if (product.images && product.images.length > 0) {
          // Find the primary image or use the first one
          const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
          
          // Add image data to map
          productImagesMap[product._id] = {
            image_url: `data:${primaryImage.content_type};base64,${primaryImage.image_data}`,
            image_name: primaryImage.image_name
          };
        }
      });
      
      console.log('Successfully fetched product images from MongoDB');
    } catch (mongoError) {
      console.error('Error fetching product images:', mongoError);
      // Continue processing - we'll use placeholders for failed images
    }

    // Process order items to ensure numeric values and add images
    const processedOrderItems = orderItems.map(item => {
      const imageData = productImagesMap[item.product_id] || null;
      
      return {
        ...item,
        unitPrice: parseFloat(item.unitPrice || 0),
        totalPrice: parseFloat(item.totalPrice || 0),
        imageUrl: imageData ? imageData.image_url : null,
        imageName: imageData ? imageData.image_name : null
      };
    });
    
    res.status(200).json({
      success: true,
      orderItems: processedOrderItems,
      total: parseFloat(totalAmount.toFixed(2)),
      isPaid: orderSummary.payment_status === 'completed',
      paymentMethod: {
        id: orderSummary.payment_method_id,
        name: orderSummary.payment_method_name,
        isOnlinePayment: orderSummary.is_online_payment === 1
      },
      deliveryMethod: {
        id: orderSummary.delivery_id,
        name: orderSummary.delivery_name,
        estimatedDays: orderSummary.estimated_days,
        cost: parseFloat(orderSummary.delivery_cost || 0)
      },
      address: {
        address_id: orderSummary.address_id,
        contact_name: orderSummary.contact_name,
        street_address: orderSummary.street_address,
        apt_suite_unit: orderSummary.apt_suite_unit,
        district: orderSummary.district,
        province: orderSummary.province,
        zip_code: orderSummary.zip_code,
        mobile_number: orderSummary.mobile_number
      },
      orderStatus: orderSummary.order_status,
      orderDate: orderSummary.created_at
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};