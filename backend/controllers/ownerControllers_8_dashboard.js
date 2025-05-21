import sqldb from '../config/sqldb.js';

// Dashboard summary stats
export const getDashboardStats = async (req, res) => {
  try {
    // Use the promise wrapper for all queries
    const [expensesTotal] = await sqldb.promise().query('SELECT COUNT(*) AS count, IFNULL(SUM(cost),0) AS totalCost FROM expenses');
    const [customersTotal] = await sqldb.promise().query('SELECT COUNT(*) AS count FROM customers');
    const [employeesTotal] = await sqldb.promise().query('SELECT COUNT(*) AS count FROM polocity_panel_users WHERE ROLE != "admin"');
    const [expensesByMonth] = await sqldb.promise().query(`
      SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(cost) AS total
      FROM expenses
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    // Calculate profit (sum of total_price where order_status = 'Shipped')
    const [profitResult] = await sqldb.promise().query(`
    SELECT IFNULL(SUM(total_price), 0) AS profit
    FROM orders
    WHERE order_status IN ('Shipped', 'Delivered')
    `);

    // Expenses by day (last 14 days)
    const [expensesByDay] = await sqldb.promise().query(`
      SELECT DATE(date) as date, SUM(cost) as total
      FROM expenses
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY DATE(date)
      ORDER BY date ASC
    `);

    // Expenses by week (last 12 weeks)
    const [expensesByWeek] = await sqldb.promise().query(`
      SELECT YEAR(date) as year, WEEK(date, 1) as week, SUM(cost) as total
      FROM expenses
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 11 WEEK)
      GROUP BY year, week
      ORDER BY year ASC, week ASC
    `);

    // Expenses by month (last 12 months)
    const [expensesByMonthNew] = await sqldb.promise().query(`
      SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(cost) as total
      FROM expenses
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    // New customers by day (last 14 days)
    const [customersByDay] = await sqldb.promise().query(`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM customers
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `);

    // New customers by week (last 12 weeks)
    const [customersByWeek] = await sqldb.promise().query(`
      SELECT YEAR(createdAt) as year, WEEK(createdAt, 1) as week, COUNT(*) as count
      FROM customers
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 11 WEEK)
      GROUP BY year, week
      ORDER BY year ASC, week ASC
    `);

    // New customers by month (last 12 months)
    const [customersByMonth] = await sqldb.promise().query(`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
      FROM customers
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    // Get sales distribution by color
    const [salesByColor] = await sqldb.promise().query(`
      SELECT 
        c.ColorValue,
        COUNT(*) as order_count,
        SUM(o.total_price) as total_sales
      FROM orders o
      JOIN product_variations pv ON o.variation_id = pv.VariationID
      JOIN colors c ON pv.ColorID = c.ColorID
      WHERE o.order_status IN ('Shipped', 'Delivered')
      GROUP BY c.ColorID, c.ColorValue
      ORDER BY total_sales DESC
    `);

    res.json({
      expenses: expensesTotal[0],
      customers: customersTotal[0].count,
      employees: employeesTotal[0].count,
      expensesByMonth: expensesByMonth.reverse(),
      profit: profitResult[0].profit,
      expensesByDay,
      expensesByWeek,
      expensesByMonth: expensesByMonthNew,
      customersByDay,
      customersByWeek,
      customersByMonth,
      salesByColor,
    });
  } catch (err) {
    res.status(500).json({ error: 'Dashboard fetch failed', details: err.message });
  }
};