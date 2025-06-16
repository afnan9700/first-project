// importing necessary modules
const express = require("express");
// route handlers
const { register, login, logout } = require("../controllers/authController");
// middleware
const requireAuth = require("../middleware/authMiddleware");

// router object which contains auth related routes
const router = express.Router();

// defining the routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);

router.get("/me", requireAuth, (req, res) => {  // auth route for testing
  res.json({ message: "Authenticated", userId: req.user.userId });
});

// exporting the router object
module.exports = router;