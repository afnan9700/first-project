// importing necessary modules
const jwt = require("jsonwebtoken");

// main middleware function
function requireAuth(req, res, next) {
    // loading the token into a variable from the recieved request
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        // verifying the jwt using our secret key and storing the decoded payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // adding a new header to the request which contains the decoded payload
        req.user = decoded;
        next();
    } catch (err) {
        console.log(err);   
        return res.status(401).json({ message: "Token invalid or expired" });
    }
}

// exporting the middleware
module.exports = requireAuth;