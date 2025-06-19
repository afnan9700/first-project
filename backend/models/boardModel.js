// importing the necessary stuff
const mongoose = require('mongoose');

// main schema
// { timestamps: true } to auto add createdAt, updatedAt values
const boardSchema = new mongoose.Schema({
  // elementary stuff
  name: { type: String, required: true, unique: true },
  tags: [{ type: String }],
  deleted: { type: Boolean, default: false },
  
  // references to members and moderators
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// query middleware to exclude deleted profiles when running 'find_' methods 
boardSchema.pre(/^find/, function (next) {
  // to bypass the the rule and include deleted, the query should specify 'includeDeleted = true'
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });  // filtering results which have 'deleted: true'
  }
  next();
});

module.exports = mongoose.model('Board', boardSchema);
