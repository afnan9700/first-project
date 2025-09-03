const Post = require('../models/postModel');
const User = require('../models/userModel');
const paginateQuery = require('../utils/paginateQuery');

const getFeed = async (req, res) => {
  try {
    // get user's joined boards
    const user = await User.findById(req.user.userId).select('joinedBoards.boardId').lean() || { joinedBoards: [] };
    if (!user.joinedBoards.length) {
      return res.json({ posts: [], nextCursor: null, hasMore: false });
    }
    // flattening the array of boardIds
    const boardIds = user.joinedBoards.map(board => board.boardId);

    const { cursor, limit = 10, sort = 'new' } = req.query; 

    const sortField = sort === 'new' ? 'createdAt' : 'createdAt'; // later extendable
    const sortOrder = -1;

    // fetching a page
    const { items, nextCursor, hasMore } = await paginateQuery({
      Model: Post,
      filter: { board: { $in: boardIds } },
      cursor,
      sortField,
      sortOrder,
      limit
    });

    // ensuring consistent response structure
    const feedItems = items.map(post => ({
      _id: post._id,
      title: post.title,
      voteCount: post.voteCount,
      createdAt: post.createdAt,
      author: post.author,
      authorName: post.authorName,
      board: post.board,
      boardName: post.boardName,
      commentCount: post.commentCount || 0,
    }));

    res.json({ posts: feedItems, nextCursor, hasMore });
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

module.exports = { getFeed };