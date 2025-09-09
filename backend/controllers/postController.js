// importing necessary modules
const Post = require("../models/postModel");
const Board = require("../models/boardModel");
const PostVote = require("../models/postVoteModel");
const paginateQuery = require('../utils/paginateQuery');

// function to add the post to db
const createPost = async (req, res) => {
  // loading the variables from request
  const { title, content, board } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    // creating the new Post object to add to db
    const newPost = new Post({
      title,
      content,
      author: req.user.userId,  // getting the _id of the user from user.userId (user header was added by requireAuth middleware)
      authorName: req.user.userName,
      board,
      boardName: board ? (await Board.findById(board).select('name').lean())?.name : null
    });

    // adding the post to the db
    const savedPost = await newPost.save();

    // sending the status code and response
    res.status(201).json(savedPost);
  } 
  catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// function to get post by its id
const getPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user ? req.user.userId : null;

        // --- Step 1: Fetch the main post document ---
        const post = await Post.findById(postId).lean();

        // Check if the post exists
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // --- Step 2: If the user is authenticated, fetch their vote ---
        let userVote = 0; // Default vote status is 0 (no vote) for guests
        if (userId) {
            // Find the specific vote by this user on this post
            const vote = await PostVote.findOne({ postId, userId }).lean();
            if (vote) {
                userVote = vote.value; // Set to 1 or -1 if a vote exists
            }
        }

        // --- Step 3: Combine the data and send the response ---
        // Create the final response object by spreading the post fields
        // and adding the user's vote status.
        const responseData = {
            ...post,
            userVote: userVote
        };
        
        res.json(responseData);

    } catch (err) {
        console.error("Error fetching post by ID:", err);
        res.status(500).json({ error: "Failed to fetch post" });
    }
};

// atomic function to handle upvotes and downvotes
const voteOnPost = async (req, res) => {
  const userId = req.user.userId;
  const { postId } = req.params;
  const { value } = req.body;

  if (![1, -1].includes(value)) {
    return res.status(400).json({ error: "Vote value must be 1 or -1" });
  }

  const session = await mongoose.startSession();  // getting the session object
  
  session.startTransaction();

  try {
    const existingVote = await PostVote.findOne({ postId, userId }).session(session);

    let delta = 0;  // variable to track change in voteCount

    if (existingVote) {
      // removing vote from PostVote collection
      if (existingVote.value === value) {
        await PostVote.deleteOne({ _id: existingVote._id }).session(session);
        delta = -value;
      } else {
        // changing vote in PostVote collection
        await PostVote.updateOne(
          { _id: existingVote._id },
          { $set: { value } }
        ).session(session);
        delta = 2 * value;
      }
    } else {
      // adding vote in PostVote collection
      await PostVote.create([{ postId, userId, value }], { session });
      delta = value;
    }

    // changing the voteCount in Post collection
    if (delta !== 0) {
      await Post.updateOne(
        { _id: postId },
        { $inc: { voteCount: delta } }
      ).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    const post = await Post.findById(postId).select("voteCount").lean();
    res.json({ voteCount: post.voteCount });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error voting on post:", err);
    res.status(500).json({ error: "Server error while voting" });
  } 
};

// get posts of a board with pagination
const getPostsByBoard = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user ? req.user.userId : null;

  try {
    const { cursor, limit = 10, sort = 'new' } = req.query; 

    const sortField = sort === 'new' ? 'createdAt' : 'createdAt'; // later extendable
    const sortOrder = -1;

    // fetching a page
    const { items, nextCursor, hasMore } = await paginateQuery({
      Model: Post,
      filter: { board: boardId, deleted: false },
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
    console.error("Error fetching posts by board:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// get posts by a specific user with pagination
const getPostsByUser = async (req, res) => {
  const { authorId } = req.params;

  const userId = req.user ? req.user.userId : null;

  try {
    const { cursor, limit = 10, sort = 'new' } = req.query; 

    const sortField = sort === 'new' ? 'createdAt' : 'createdAt'; // later extendable
    const sortOrder = -1;

    // fetching a page
    const { items, nextCursor, hasMore } = await paginateQuery({
      Model: Post,
      filter: { author: authorId, deleted: false },
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
    console.error("Error fetching posts by board:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// handler to edit a post
const editPost = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  
  try {
    // checking post existence
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    // verifying user
    if (!post.author.equals(req.user.userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // editing logic
    post.content = content;
    post.updatedAt = new Date();
    await post.save();
    res.json({ message: "Post updated", post });
  }
  catch(err){
    console.error("Error editing post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// handler to delete a post
const deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    // checking post existence
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // verifying user (must be either the author or mod)
    const isAuthor = post.author.equals(req.user.userId);
    let isMod = false;  // if post was made to a board, the mod also has access to delete it
    
    // checking if the post was made to a board
    if (post.board) {
      const board = await Board.findById(post.board);
      isMod = board?.moderators.includes(req.user.userId.toString());  // verifying board's mod
    }

    if (!isAuthor && !isMod)
      return res.status(403).json({ error: "Not authorized" });

    // we hard delete if post has no comments
    const hasComments = await Comment.exists({ post: post._id });

    if (hasComments) {
      // Soft delete
      post.deleted = true;
      post.content = '[removed]'; // optional
      await post.save();
    } else {
      // hard delete
      await post.deleteOne();
    }

    res.json({ message: "Post deleted" });
  }
  catch(err){
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createPost, getPostById, voteOnPost, getPostsByBoard, editPost, deletePost, getPostsByUser };