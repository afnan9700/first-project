// importing necessary modules
const express = require("express");

// router object which contains auth related routes
const router = express.Router();

// route handlers
const { register, login, logout } = require("../controllers/authController");

// defining the routes
router.post("/register", register);
router.post("/login", login);

// testing middleware
const requireAuth = require("../middlewares/authMiddleware");
router.post("/logout", requireAuth, logout);

router.get("/me", requireAuth, (req, res) => {
  res.json({ message: "Authenticated", userId: req.user.userId });
});

// exporting the router object
module.exports = router;