// importing the libraries
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser"); 

// loading all environment variables
require("dotenv").config(); 
const PORT = process.env.PORT || 5000;

// think of app as the core object of the express application
const app = express();

// enabling cross-origin requests using the cors() middleware
// `credentials: true` to attach cookies to the requests made
// the list of allowed origins can be controlled even more by the options object to cors()
const whitelist = ["http://localhost:5000", "http://localhost:5173"];
app.use(cors({
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// using the json middleware to enable automatic json parsing for requests
app.use(express.json());
// using the coookieparser middleware to parse the cookies attached in the requests
app.use(cookieParser());

// importing the routers
const authRoutes = require("./routes/authRoute");
const postRoutes = require("./routes/postRoute");

// attaching the routers to the routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// testing
app.get("/", (req, res) => {
    res.send("API running...");
});

// connecting to mongodb and starting the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB error:", err));