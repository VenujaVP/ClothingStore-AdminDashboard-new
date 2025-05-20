//middleware/authMiddleware.js

import jwt from 'jsonwebtoken';

const verifyUser = (req, res, next) => {
    const token = req.cookies.token; // Get token from cookies
    if (!token) {
        return res.status(401).json({ Status: "Error", message: "No token provided" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ Status: "Error", message: "Invalid token" });
        }
        req.id = decoded.id; // Attach user name to request object
        next();
    });
};

export default verifyUser;