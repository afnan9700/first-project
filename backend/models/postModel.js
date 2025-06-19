// importing the necessary stuff
const mongoose = require("mongoose");

// main schema
const postSchema = new mongoose.Schema({
  // the elementary stuff
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', default: null },

  // total votes
  voteCount: { type: Number, default: 0 },

  // an array storing (user, vote_value) for the users that vote
  votes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      value: { type: Number, enum: [1, -1] },
    }
  ],

  // flag for soft deletion
  deleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);