const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String },

  // total votes
  voteCount: { type: Number, default: 0 },

  // an array storing (user, vote_value) for the users that vote
  votes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      value: { type: Number, enum: [1, -1] },
    }
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);