// importing necessary modules
const Post = require("../models/postModel");
const Board = require("../models/boardModel");
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
  // post id is passed in the url as a route param
  const { postId } = req.params;

  try {
    // storing the post object with postId in a variable
    // the author field is populated with referenced User's username
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // sending the response
    res.json(post);
  } 
  catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// atomic function to handle upvotes and downvotes
const voteOnPost = async (req, res) => {
    // user is added to the request by the authMiddleware
    const userId = req.user.userId;
    const { postId } = req.params;
    const { value } = req.body;

    // checking if the value is valid
    if (![1, -1].includes(value)) {
        return res.status(400).json({ error: 'Vote value must be 1 or -1' });
    }

    try {
        let post = null;
        
        // try to change an existing vote from -value to value
        let result = await Post.updateOne(
            { _id: postId, votes: { $elemMatch: { user: userId, value: -value } } },
            { $set: { "votes.$.value": value }, $inc: { voteCount: 2 * value } }
        );
        if (result.modifiedCount > 0) {
            post = await Post.findById(postId).select('voteCount').lean();
            return res.json({ voteCount: post.voteCount });
        }

        // try to remove an existing vote of the same value
        result = await Post.updateOne(
            { _id: postId, votes: { $elemMatch: { user: userId, value: value } } },
            { $pull: { votes: { user: userId } }, $inc: { voteCount: -value } }
        );
        if (result.modifiedCount > 0) {
            post = await Post.findById(postId).select('voteCount').lean();
            return res.json({ voteCount: post.voteCount });
        }
        
        // add a new vote
        result = await Post.updateOne(
            { _id: postId, "votes.user": { $ne: userId } },
            { $push: { votes: { user: userId, value } }, $inc: { voteCount: value } }
        );

        post = await Post.findById(postId).select('voteCount').lean();
        
        res.json({ voteCount: post.voteCount });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while voting' });
    }
};

// get posts of a board with pagination
const getPostsByBoard = async (req, res) => {
  const { boardId } = req.params;

  const { cursor, limit = 10, sort = 'new' } = req.query;

  try {
    const sortField = sort === 'new' ? 'createdAt' : 'createdAt'; 

    const { items, nextCursor, hasMore } = await paginateQuery({
      Model: Post,
      filter: { board: boardId },
      cursor,
      sortField,
      sortOrder,
      limit,
    });

    const posts = items.map(post => ({
      _id: post._id,
      title: post.title,
      voteCount: post.voteCount,
      createdAt: post.createdAt,
      author: post.authorName,
      commentCount: post.commentCount || 0,
    }));

    res.status(200).json({ posts, nextCursor, hasMore });
  } catch (err) {
    console.error("Error fetching posts by board:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// get posts by a specific user with pagination
const getPostsByUser = async (req, res) => {
  const { userId } = req.params;

  const { cursor, limit = 10, sort = 'new' } = req.query;

  try {
    const sortField = sort === 'new' ? 'createdAt' : 'createdAt';
    const sortOrder = -1;

    const { items, nextCursor, hasMore } = await paginateQuery({
      Model: Post,
      filter: { author: userId, deleted: false },
      cursor,
      sortField,
      sortOrder,
      limit,
    });

    const posts = items.map(post => ({
      _id: post._id,
      title: post.title,
      voteCount: post.voteCount,
      createdAt: post.createdAt,
      board: post.boardName,
      commentCount: post.commentCount || 0,
    }));

    res.json({ posts, nextCursor, hasMore });
  } catch (err) {
    console.error("Error fetching posts by user:", err);
    res.status(500).json({ error: 'Server error' });
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