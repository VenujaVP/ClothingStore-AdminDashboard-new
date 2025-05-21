import { sqldb } from '../config/db.js';

// Helper function to format date for SQL queries
const getDateRange = (range) => {
  const today = new Date();
  let startDate;
  
  switch(range) {
    case 'week':
      // Get date from 7 days ago
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      // Get date from 30 days ago
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    case 'year':
      // Get date from 365 days ago
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 365);
      break;
    default:
      // Default to 7 days
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
};

// Get all dashboard data in a single API call
export const getDashboardData = async (req, res) => {
  const { range = 'week' } = req.query;
  const { startDate, endDate } = getDateRange(range);
  
  try {
    // Get key stats
    const stats = await getStats(startDate, endDate);
    
    // Get recent orders
    const recentOrders = await getRecentOrders();
    
    // Get sales data for chart
    const salesData = await getSalesData(range, startDate, endDate);
    
    // Get product category data
    const productCategories = await getProductCategories();
    
    // Get order status distribution
    const orderStatus = await getOrderStatusDistribution();
    
    // Get recent return requests
    const recentReturns = await getRecentReturns();
    
    res.status(200).json({
      success: true,
      stats,
      recentOrders,
      salesData,
      productCategories,
      orderStatus,
      recentReturns
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Helper function to get key stats
const getStats = async (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    const statsQuery = `
      SELECT
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_id IS NOT NULL) AS totalRevenue,
        (SELECT COUNT(*) FROM orders WHERE order_status IN ('Unpaid', 'To be Shipped')) AS pendingOrders,
        (SELECT COUNT(*) FROM product_table WHERE IsActive = TRUE) AS totalProducts,
        (SELECT COUNT(*) FROM customers) AS totalCustomers,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND payment_id IS NOT NULL) AS todaySales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND payment_id IS NOT NULL) AS monthlySales,
        (SELECT COUNT(*) FROM product_variations WHERE units <= 5) AS lowStockProducts,
        (SELECT COUNT(*) FROM order_returns WHERE return_status = 'Pending') AS returnRequests
    `;
    
    sqldb.query(statsQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

// Helper function to get recent orders
const getRecentOrders = async () => {
  return new Promise((resolve, reject) => {
    const ordersQuery = `
      SELECT 
        o.order_id,
        c.NAME as customer_name,
        p.ProductName as product_name,
        o.total_amount,
        o.order_status,
        o.created_at
      FROM 
        orders o
      JOIN 
        customers c ON o.customer_id = c.ID
      JOIN 
        product_table p ON o.product_id = p.ProductID
      ORDER BY 
        o.created_at DESC
      LIMIT 10
    `;
    
    sqldb.query(ordersQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Helper function to get sales data for charts
const getSalesData = async (range, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    let groupBy, dateFormat;
    
    // Determine grouping based on date range
    if (range === 'week') {
      groupBy = 'DATE(created_at)';
      dateFormat = '%Y-%m-%d';
    } else if (range === 'month') {
      groupBy = 'DATE(created_at)';
      dateFormat = '%Y-%m-%d';
    } else if (range === 'year') {
      groupBy = 'MONTH(created_at)';
      dateFormat = '%Y-%m';
    }
    
    const salesQuery = `
      SELECT 
        ${groupBy === 'MONTH(created_at)' 
          ? "DATE_FORMAT(created_at, '%Y-%m')" 
          : "DATE_FORMAT(created_at, '%Y-%m-%d')"
        } as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM 
        orders
      WHERE 
        created_at BETWEEN ? AND ? 
        AND payment_id IS NOT NULL
      GROUP BY 
        ${groupBy}
      ORDER BY 
        date ASC
    `;
    
    sqldb.query(salesQuery, [startDate, endDate], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Helper function to get product categories data
const getProductCategories = async () => {
  return new Promise((resolve, reject) => {
    const categoriesQuery = `
      SELECT 
        p.Category1 as category,
        COUNT(p.ProductID) as products,
        COUNT(o.order_id) as sales
      FROM 
        product_table p
      LEFT JOIN 
        orders o ON p.ProductID = o.product_id
      GROUP BY 
        p.Category1
      ORDER BY 
        sales DESC
      LIMIT 6
    `;
    
    sqldb.query(categoriesQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Helper function to get order status distribution
const getOrderStatusDistribution = async () => {
  return new Promise((resolve, reject) => {
    const statusQuery = `
      SELECT 
        order_status as name,
        COUNT(*) as value
      FROM 
        orders
      GROUP BY 
        order_status
    `;
    
    sqldb.query(statusQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Helper function to get recent return requests
const getRecentReturns = async () => {
  return new Promise((resolve, reject) => {
    const returnsQuery = `
      SELECT 
        r.return_id,
        r.order_id,
        r.return_reason,
        r.return_status,
        r.created_at,
        p.ProductName as product_name,
        c.NAME as customer_name
      FROM 
        order_returns r
      JOIN 
        orders o ON r.order_id = o.order_id
      JOIN 
        product_table p ON o.product_id = p.ProductID
      JOIN 
        customers c ON r.customer_id = c.ID
      ORDER BY 
        r.created_at DESC
      LIMIT 5
    `;
    
    sqldb.query(returnsQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Get expenses summary
export const getExpensesSummary = async (req, res) => {
  const { range = 'month' } = req.query;
  const { startDate, endDate } = getDateRange(range);
  
  try {
    const expensesQuery = `
      SELECT 
        expenses_name,
        SUM(cost) as total_cost,
        DATE_FORMAT(date, '%Y-%m-%d') as expense_date
      FROM 
        expenses
      WHERE 
        date BETWEEN ? AND ?
      GROUP BY 
        expenses_name, expense_date
      ORDER BY 
        date DESC
    `;
    
    sqldb.query(expensesQuery, [startDate, endDate], (err, results) => {
      if (err) {
        console.error('Error fetching expenses summary:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch expenses summary',
          error: err.message
        });
      }
      
      // Calculate total expenses
      const totalExpenses = results.reduce((sum, expense) => sum + parseFloat(expense.total_cost), 0);
      
      // Group expenses by category
      const expensesByCategory = results.reduce((acc, expense) => {
        if (!acc[expense.expenses_name]) {
          acc[expense.expenses_name] = 0;
        }
        acc[expense.expenses_name] += parseFloat(expense.total_cost);
        return acc;
      }, {});
      
      // Format for chart data
      const chartData = Object.keys(expensesByCategory).map(category => ({
        name: category,
        value: expensesByCategory[category]
      }));
      
      res.status(200).json({
        success: true,
        expensesData: results,
        totalExpenses,
        chartData
      });
    });
  } catch (error) {
    console.error('Error in getExpensesSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses summary',
      error: error.message
    });
  }
};