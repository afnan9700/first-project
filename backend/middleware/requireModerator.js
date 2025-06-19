// importing the necessary stuff
const Board = require("../models/Board");

// main middleware function
const requireModerator = async (req, res, next) => {
  const boardId = req.params.boardId;
  const userId = req.user.userId;

  try {
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ error: "Board not found" });

    if (!board.moderators.includes(userId.toString())) {
      return res.status(403).json({ error: "Moderator access required" });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = requireModerator;