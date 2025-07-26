// importing necessary modules
const Post = require("../models/postModel");

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
      board
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
    const post = await Post.findById(postId).populate("author", "username");

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

// function to get posts (optionally filtered by author)
const getPosts = async (req, res) => {
  // author name is passed as a query parameter
  const { author } = req.query;

  // filter object for searching using mongoose
  const filter = {};
  if (author) filter.author = author;

  try {
    // fetching all the posts made by "author"
    // finding all posts by author, sorting acc to date, populating the post's author field with referenced User's username
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("author", "username");

    // sending the response
    res.json(posts);
  } 
  catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// function to handle upvotes and downvotes
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
    // fetching the post from database
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // checking if a vote has already been made by searching the post's "votes" array
    const existingVote = post.votes.find(v => v.user.toString() === userId.toString());
    
    // voting logic
    if (existingVote) {
      if (existingVote.value === value) {
        post.votes = post.votes.filter(v => v.user.toString() !== userId.toString());
        post.voteCount -= value;
      } else {
        post.voteCount += 2 * value;
        existingVote.value = value;
      }
    } else {
      post.votes.push({ user: userId, value });
      post.voteCount += value;
    }
    
    // saving the vote to db and sending the response
    await post.save();
    res.json({ voteCount: post.voteCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while voting' });
  }
};

// get all posts of a board
const getPostsByBoard = async (req, res) => {
  // boardId passed as route param
  const { boardId } = req.params;

  try {
    // fetching board's posts and populating author fields
    const posts = await Post.find({ board: boardId })
      .sort({ createdAt: -1 })
      .populate('author', 'username')

    // sending response
    return res.status(200).json(posts);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch posts" });
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

const getPostsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const posts = await Post.find({ author: userId, deleted: false })
      .populate('board', 'name') // populate board name
      .sort({ createdAt: -1 }); // newest first

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createPost, getPostById, getPosts, voteOnPost, getPostsByBoard, editPost, deletePost, getPostsByUser };