//server.js

// to run - npm start

// npm init -y - Initialize the Backend
// "start": "nodemon server.js","dev": "nodemon server.js" - meekth dnn packace.json eke sctipt nodemon active krnn
// "type": "module", - main eken phlt dnn package.json wlt

// npm i -D nodemon ->developer depemdancy

// npm install mysql2 dotenv bcrypt jsonwebtoken express cors cookie-parser mongoose express-validator
// npm install express-validator for validations = for Parameterized Queries:
// npm install nodemailer
// npm install mongodb mongoose multer
// npm install stripe

import {connectToDatabase} from './config/mongodb.js'; // MongoDB connection
import sqldb from './config/sqldb.js'
import authRoutes from './routes/authRoutes.js'
import verifyUser from './middleware/authMiddleware.js';
import cleanupExpiredTokens from './services/tokenCleanup.js';

import ownerRoutes from './routes/ownerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js'; // Import payment routes
import employeeRoutes from './routes/employeeRoutes.js'; // Import employee routes
import quriaServiceRoutes from './routes/quriaServiceRoutes.js';


import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
dotenv.config();


// Create Express app -----------------------------------------act as your HTTP server
const app = express();

app.use(express.json());  //--------------------------Parses incoming JSON request bodies and makes the data accessible

// Middleware
app.use(cors({          //---------------------------------Allows requests from different origins
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],  //---------------Specifies the HTTP methods that are allowed
    credentials: true   //-----------------------------------allows the browser to send cookies and authentication credentials
}));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
// app.use('/forgot-password', forgotPasswordRoutes); 

//Owner
app.use('/api/owner', ownerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/courier', quriaServiceRoutes);

app.use('/api/userpayement', paymentRoutes);


app.get('/tokenverification', verifyUser, (req, res) => {
    // If the token is verified, send back the user information
    return res.status(200).json({ Status: "Success", id: req.id });
});

// Token cleanup every 5 minutes
setInterval(async () => {
    console.log("Token cleanup initiated.");
    await cleanupExpiredTokens();
}, 10 * 60 * 1000); // Runs every 5 minutes


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));