/* Run this script to promote a user to admin */
/* run `node promoteToAdmin.js` */
// importing necessary stuff
const mongoose = require("mongoose");
const User = require("../models/userModel");

// set your username here
const username = "johndoe";

require("dotenv").config(); 
// connecting to mongodb
mongoose.connect(process.env.MONGO_URI).then(async () => {
  // fetching the user
  const user = await User.findOne({ username: username });
  if (!user) {
    console.error("User not found");
    return;
  }

  // promoting to admin
  user.isAdmin = true;
  await user.save();
  console.log("User promoted to admin");
  // exiting the script
  process.exit();
});