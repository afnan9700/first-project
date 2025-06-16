// importing the necessary stuff
const mongoose = require("mongoose");

// main schema
const userSchema = new mongoose.Schema({
    // each user has a username and a password
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

module.exports = mongoose.model("User", userSchema);