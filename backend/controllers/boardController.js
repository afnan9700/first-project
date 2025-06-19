// importing the necessary stuff
const Board = require('../models/boardModel');
const User = require('../models/userModel');

// create board handler
const ALLOWED_TAGS = require('../utils/allowedTags');  // list of valid tags
const createBoard = async (req, res) => {
  // name, description, tags 
  const { name, description, tags } = req.body;
  const userId = req.user.userId;  // _id of the user from user.userId (user header was added by requireAuth middleware)
  
  if (!name) {  // checking name
    return res.status(400).json({ error: "Board name is required." });
  }
  if (!(tags.every(tag => ALLOWED_TAGS.includes(tag.toLowerCase())))) {  // checking valid tags
    return res.status(400).json({ error: "Invalid tags provided" });
  }

  try {
    // check if the board already exists
    const existing = await Board.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: "Board with this name already exists." });
    }

    // creating the board and saving it to db
    const board = new Board({
      name,
      description,
      tags: tags || [],
      members: [userId],
      moderators: [userId],
      createdBy: userId
    });
    await board.save();

    // sending the response
    return res.status(201).json({ message: "Board created successfully.", board });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// joining a board handler
const joinBoard = async (req, res) => {
  const boardId = req.params.boardId;  // boardId from route params
  const userId = req.user.userId;  // getting the _id of the user from user.userId (user header was added by requireAuth middleware)

  try {
    // fetching the user and the board from db
    const board = await Board.findById(boardId);
    const user = await User.findById(userId);

    if (!board) return res.status(404).json({ error: 'Board not found' });

    // joining logic
    if (!board.members.includes(userId)) {
      board.members.push(userId);
      await board.save();
    }
    if (!user.joinedBoards.includes(boardId)) {
      user.joinedBoards.push(boardId);
      await user.save();
    }

    // sending response
    res.json({ message: 'Joined board' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// leaving a board handler
const leaveBoard = async (req, res) => {
  const boardId = req.params.boardId;  // boardId from route params
  const userId = req.user.userId;  // getting the _id of the user from user.userId (user header was added by requireAuth middleware)

  try {
    // fetching the user and the board from db
    const board = await Board.findById(boardId);
    const user = await User.findById(userId);

    if (!board) return res.status(404).json({ error: 'Board not found' });

    // leaving logic
    board.members = board.members.filter(id => id.toString() !== userId.toString());
    user.joinedBoards = user.joinedBoards.filter(id => id.toString() !== boardId.toString());
    await board.save();
    await user.save();

    res.json({ message: 'Left board' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};


// to get boards a user is in
const getUserBoards = async (req, res) => {
  // userId in the route params
  const { userId } = req.params;

  try {
    // populating user's board attribute with name, descriptiona, tags
    if (!user) return res.status(404).json({ error: "User not found" });
    const user = await User.findById(userId).populate('boards', 'name description tags');

    return res.status(200).json(user.boards);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch user's boards" });
  }
};

// edit board information handler
const editBoard = async (req, res) => {
  const { boardId } = req.params;
  const { description, tags } = req.body;

  try {
    const board = await Board.findById(boardId);
    if (description !== undefined) board.description = description;
    if (tags !== undefined) board.tags = tags;

    await board.save();
    res.json({ message: "Board updated", board });
  }
  catch(err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// handler to promote a member to mod
const promoteToModerator = async (req, res) => {
  const { boardId } = req.params;
  const { userId } = req.body;
  
  try {
    // checking if the user is a member
    const board = await Board.findById(boardId);
    if (!board.members.includes(userId)) {
      return res.status(400).json({ error: "User is not a member" });
    }
    
    // making sure that the member isn't already a mod
    if (!board.moderators.includes(userId)) {
      board.moderators.push(userId);
      await board.save();
    }

    res.json({ message: "User promoted" });
  }
  catch(err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// demote self handler
const demoteSelf = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.userId.toString();

  try {
    const board = await Board.findById(boardId);
    
    // handling last moderator condition
    const modCount = board.moderators.length;
    if (modCount === 1) {
      return res.status(400).json({ error: "You are the last moderator" });
    }

    // demoting logic
    board.moderators = board.moderators.filter(id => id !== userId);
    await board.save();
    res.json({ message: "You have been demoted" });
  }
  catch(err){
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// kick member from the board handler
const kickMember = async (req, res) => {
  const { boardId } = req.params;
  const { memberId } = req.body;

  try {
    const board = await Board.findById(boardId);

    // moderators cant be kicked
    if (board.moderators.includes(memberId)) {
      return res.status(400).json({ error: "User is a moderator" });
    }

    board.members = board.members.filter(id => id !== memberId);
    
    await board.save();
    res.json({ message: "User removed from board" });
  }
  catch(err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// delete board handler
const deleteBoard = async (req, res) => {
  try {
    const board = req.board;

    // removing the board from all users’ joinedBoards lists
    await User.updateMany(
      { joinedBoards: board._id },
      { $pull: { joinedBoards: board._id } }
    );

    // setting deleted to true
    board.deleted = true;
    board.name = "<deleted>";
    board.description = undefined; 
    
    res.json({ message: "Board deleted successfully." });
  } 
  catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  createBoard,
  joinBoard,
  leaveBoard,
  getUserBoards,
  editBoard,
  promoteToModerator,
  kickMember,
  demoteSelf,
  deleteBoard
};
