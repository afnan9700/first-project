// importing the necessary stuff
const mongoose = require("mongoose");

// main schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    joinedBoards: [{
        boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
        boardName: { type: String, required: true }
    }],
    followedTags: [{ type: String }]
});

// query middleware to exclude deleted profiles when running 'find_' methods 
userSchema.pre('/^find/', function (next) {
  // to bypass the the rule and include deleted, the query should specify 'includeDeleted = true'
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });  // filtering results which have 'deleted: true'
  }
  next();
});

module.exports = mongoose.model("User", userSchema);