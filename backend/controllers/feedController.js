// importing the necessary stuff
const Post = require('../models/postModel');
const mongoose = require('mongoose');
const User = require('../models/userModel');

const getFeed = async (req, res) => {
  try {
    // loading the boards user has joined from req.user which was added by auth middleware
    const user = await User.findById(req.user.userId).select('joinedBoards').lean()  || [];
    const userBoards = user.joinedBoards;
    
    if (userBoards.length === 0) {
      return res.json({ posts: [], nextCursor: null, hasMore: false });
    }
    
    // loading the variables from query params
    const { cursor, limit = 10, sort = 'new' } = req.query;
    const pageSize = parseInt(limit, 10);   // query params are strings, so parsing it as int

    // setting up sortField and sortOrder
    // sortField: post attribute to sort the feed posts according to
    // sortOrder: ascending or descending
    let sortField, sortOrder;
    switch (sort) {
      case 'new':
        sortField = 'createdAt'; 
        sortOrder = -1;
        break;
      default:
        sortField = 'createdAt'; 
        sortOrder = -1;
    }

    // filter object to pass to mongoose find()
    const filter = { board: { $in: userBoards } };

    // adding the cursor-related options to filter object
    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
      // fetching the post pointed by the cursor
      const cursorPost = await Post.findById(cursor).lean();
      if (!cursorPost) {
        return res.status(400).json({ error: 'Cursor post not found' });
      }
      // setting up the 'lesser than' attribute for sortField
      // we fetch the next pageSize posts strictly lesser than the cursor's sortField
      filter[sortField] = { $lt: cursorPost[sortField] };
    }

    // fetching the posts
    // fetching an extra post to determine hasMore
    const posts = await Post.find(filter)
      .sort({ [sortField]: sortOrder })
      .limit(pageSize + 1)
      .populate('author', 'username')
      .populate('board', 'name')
      .lean();

    // determining if nextPage exists
    const hasMore = posts.length > pageSize;
    if (hasMore) posts.pop();

    // nextcursor is the _id of the last post in the current page
    const nextCursor = hasMore ? posts[posts.length - 1]._id.toString() : null;

    // preparing everything to display in the feed
    const feedItems = posts.map(post => ({
      _id: post._id,
      title: post.title,
      voteCount: post.voteCount,
      createdAt: post.createdAt,
      author: post.author,  
      board: post.board,
      commentCount: post.commentCount || 0
    }));

    // sending the response
    res.json({ posts: feedItems, nextCursor, hasMore });
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

module.exports = { getFeed };