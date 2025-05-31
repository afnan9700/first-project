// importing necessary modules
const Post = require("../models/postModel");

// function to add the post to db
const createPost = async (req, res) => {
  // loading the variables from request
  const { title, content } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  try {
    // creating the new Post object to add to db
    const newPost = new Post({
      title,
      content,
      author: req.user.userId,  // getting the _id of the user from user.userId (user header was added by requireAuth middleware)
    });

    // adding the post to the db
    const savedPost = await newPost.save();

    // sending the status code and response
    res.status(201).json(savedPost);
  } 
  catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Internal server error" });
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
      return res.status(404).json({ message: "Post not found" });
    }

    // sending the response
    res.json(post);
  } 
  catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Internal server error" });
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
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createPost, getPostById, getPosts };