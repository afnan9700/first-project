// importing necessary modules
// bcrypt for password encryption, jwt for session management
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// register handler
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // if any fields were not provided
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already taken." });
    }

    // hashing the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // creating a new user object for the input username and password
    const newUser = new User({ username, password: hashedPassword, isAdmin: false });

    // adding the user to database
    await newUser.save();

    // generate the jwt token for the user
    const token = jwt.sign({ userId: newUser._id, userName: newUser.username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // attaching the token to the response as a cookie 
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000 // 1 hour
    });

    // send the message as a response with the http 200 code (successful request)
    res.status(200).json({ message: "Login successful." });
  }
  catch (err) {
    // handling errors
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// login handler
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // check if user already exists
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // find user. and if not found, send a response containing the message
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // compare the password entered. 
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id, userName: username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // attaching the token to the response as a cookie 
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000 // 1 hour
    });

    // send the message as a response with the http 200 code (successful request)
    res.status(200).json({ message: "Login successful." });
  } 
  catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// logout handler
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully." });
  }
  catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// exporting the auth related route handlers
module.exports = { register, login, logout };