const Post = require('../models/postModel');
const User = require('../models/userModel');
const paginateQuery = require('../utils/paginateQuery');

const getFeed = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;

    // get user's joined boards
    let filter = {};
        if (userId) {
            // AUTHENTICATED USER: Fetch posts from their joined boards.
            const user = await User.findById(userId).select('joinedBoards.boardId').lean();
            if (!user || !user.joinedBoards.length) {
                // If the user has joined no boards, return an empty feed.
                return res.json({ posts: [], nextCursor: null, hasMore: false });
            }
            const boardIds = user.joinedBoards.map(board => board.boardId);
            filter = { board: { $in: boardIds } };
        } else {
            // GUEST USER: Fetch the newest/most popular posts from all boards.
            // The filter remains an empty object {} to query all posts.
        }

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

    let userVotesMap = {}; // Default to an empty map for guests
        if (userId && items.length > 0) {
            // 1. Get all the post IDs from the current page.
            const postIds = items.map(post => post._id);

            // 2. Perform ONE query to find all of the user's votes for these specific posts.
            const userVotes = await PostVote.find({
                userId: userId,
                postId: { $in: postIds }
            }).lean();

            // 3. Convert the array of votes into a Map for quick lookups (O(1) complexity).
            // The key is the postId, the value is the vote (1 or -1).
            userVotesMap = userVotes.reduce((map, vote) => {
                map[vote.postId] = vote.value;
                return map;
            }, {});
        }

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
      userVote: userVotesMap[post._id] || 0
    }));

    res.json({ posts: feedItems, nextCursor, hasMore });
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

module.exports = { getFeed };