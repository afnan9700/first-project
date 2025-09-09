// importing necessary modules
const jwt = require("jsonwebtoken");

// This new middleware CHECKS for a user but doesn't REQUIRE one.
function checkAuth(req, res, next) {
    const token = req.cookies.token;

    // If there's no token, we can't authenticate the user.
    // Instead of sending an error, we just move on. req.user will be undefined.
    if (!token) {
        return next();
    }

    try {
        // If there is a token, we verify it.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // If valid, attach the user payload to the request.
        req.user = decoded;
        next();
    } catch (err) {
        console.log("Invalid token recieved, proceeding as guest.");
        next();
    }
}

// exporting the middleware
module.exports = checkAuth;