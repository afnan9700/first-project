// models/postVoteModel.js
const mongoose = require("mongoose");

const postVoteSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  value: { type: Number, enum: [1, -1], required: true }
}, { timestamps: true });

// Ensure a user can only vote once per post
postVoteSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("PostVote", postVoteSchema);
