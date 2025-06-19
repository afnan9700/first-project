const User = require("../models/userModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const Board = require("../models/boardModel");

// getting stats of the database
const getStats = async (req, res) => {
  try {
    // promise that resolves only upon resolution of all internal function calls
    const [users, posts, comments, boards] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Board.countDocuments(),
    ]);
    res.json({ users, posts, comments, boards });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
};

// to delete all data on the database
const deleteAllData = async (req, res) => {
  try {
    // promise that resolves only upon the resolution of all internal function calls
    await Promise.all([
      User.deleteMany({}),
      Board.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    res.json({ message: "All data deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete data." });
  }
};