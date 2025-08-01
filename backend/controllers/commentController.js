// importing the necessary stuff
const Comment = require('../models/commentModel');
const Post = require('../models/postModel');

// adding a new comment handler
const createComment = async (req, res) => {
  // the postId from route params
  const { postId } = req.params;
  const { content, parentCommentId } = req.body;
  const userId = req.user.userId;  // _id of the user from user.userId (user header was added by requireAuth middleware)
  
  try {
    // check if post even exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // if reply, check parent comment exists
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent) return res.status(400).json({ error: 'Parent comment not found' });
    }

    // adding the comment to db directly using create function    
    const comment = await Comment.create({
      post: postId,
      parentComment: parentCommentId || null,
      author: userId,
      content
    }); 

    // sending the response
    res.status(201).json(comment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// getting parent comments of a post
const getPostComments = async (req, res) => {
  // postId from route params
  const { postId } = req.params;

  try {
    // fetching all parent comments of the post by searching through the comments collection
    const comments = await Comment.find({ post: postId, parentComment: null })
      .sort({ createdAt: -1 })  // oldest to newest
      .populate('author', 'username');

    // sending the response
    res.json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// getting replies of a comment
const getCommentReplies = async (req, res) => {
  // commentId from route params
  const { commentId } = req.params;

  try {
    // fetching all replies by seraching through the comments collection
    const replies = await Comment.find({ parentComment: commentId })
      .sort({ createdAt: 1 })  // oldest to newest
      .populate('author', 'username');

    // sending the response
    res.json(replies);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
};

// comment votes handler
const voteOnComment = async (req, res) => {
  // commendId from route params
  const { commentId } = req.params;
  const { value } = req.body;
  const userId = req.user.userId;  // _id of the user from user.userId (user header was added by requireAuth middleware)

  // checking if the value is valid
  if (![1, -1].includes(value)) {
    return res.status(400).json({ error: 'Invalid vote value' });
  }

  try {
    // fetching the comment
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // check if the user has already voted
    const existingVote = comment.votes.find(v => v.user.toString() === userId.toString());

    // voting logic
    if (existingVote) {
      if (existingVote.value === value) {
        comment.votes = comment.votes.filter(v => v.user.toString() !== userId.toString());
        comment.voteCount -= value;
      } else {
        // change direction
        existingVote.value = value;
        comment.voteCount += 2 * value;
      }
    } else {
      comment.votes.push({ user: userId, value });
      comment.voteCount += value;
    }

    // saving the vote to db and sending the response
    await comment.save();
    res.json({ voteCount: comment.voteCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to vote' });
  }
};

// handler to edit a comment
const editComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  
  try {
    // checking comment existence
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    // verifying user
    if (!post.author.equals(req.user.userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // editing logic
    comment.content = content;
    comment.updatedAt = new Date();
    await comment.save();
    res.json({ message: "Comment updated", comment });
  }
  catch(err){
    console.error("Error editing comment: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// handler to delete a comment
const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    // checking comment existence
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // verifying user (must be either the author or mod)
    const isAuthor = post.author.equals(req.user.userId);
    let isMod = false;  // if comment was made to a board, the mod also has access to delete it
    
    // checking if the comment was made to a board
    const post = await Post.findById(comment.post);
    if (post.board) {
      const board = await Board.findById(post.board);
      isMod = board?.moderators.includes(req.user.userId.toString());  // verifying board's mod
    }

    if (!isAuthor && !isMod)
      return res.status(403).json({ error: "Not authorized" });

    // we hard delete if a comment has no replies
    const hasReplies = await Comment.exists({ replyTo: comment._id });

    if (hasReplies) {
      // soft delete
      comment.deleted = true;
      comment.content = '[deleted]'; // optional
      await comment.save();
    } else {
      // hard delete
      await comment.deleteOne();
    }

    res.json({ message: "Comment deleted" });
  }
  catch(err){
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCommentsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const comments = await Comment.find({ author: userId, deleted: false })
      .populate('post', 'title') // include post title
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createComment, getPostComments, getCommentReplies, voteOnComment, editComment, deleteComment, getCommentsByUser };