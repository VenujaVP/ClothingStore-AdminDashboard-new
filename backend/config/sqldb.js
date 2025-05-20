import mysql from 'mysql2'; // Use promise-based MySQL
import dotenv from 'dotenv';

dotenv.config();

const sqldb = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log("✅ Database connected!");

export default sqldb;
