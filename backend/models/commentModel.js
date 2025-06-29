// importing the necessary stuff
const mongoose = require('mongoose');

// temp vote schema schema
const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, enum: [1, -1], required: true }
}, { _id: false });

// main schema
// { timestamps: true } to auto add createdAt, updatedAt values
const commentSchema = new mongoose.Schema({
  // references to either post or parent comment
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  
  // elementary stuff
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  
  // votes for the comment
  votes: [voteSchema],
  voteCount: { type: Number, default: 0 },

  // flag for soft deletion
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
