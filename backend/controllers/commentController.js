// importing the necessary stuff
const Comment = require('../models/commentModel');
const Post = require('../models/postModel');
const processComments = require('../utils/processComments');

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
      postTitle: post.title, 
      parentComment: parentCommentId || null,
      author: userId,
      authorName: req.user.userName,
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
    const { postId } = req.params;
    // Safely get the viewer's userId from the checkAuth middleware.
    const userId = req.user ? req.user.userId : null;

    try {
        // Fetch comments using .lean() for better performance.
        const comments = await Comment.find({ post: postId, parentComment: null })
            .sort({ createdAt: -1 })
            .lean(); // Use .lean() as we are only reading data.

        // Process the comments to add userVote and clean the output.
        const processedComments = processComments(comments, userId);
        
        res.json(processedComments);
    } catch (err) {
        console.error("Error fetching post comments:", err);
        res.status(500).json({ error: 'Failed to fetch comments of the post' });
    }
};

// getting replies of a comment
const getCommentReplies = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user ? req.user.userId : null;

    try {
        const replies = await Comment.find({ parentComment: commentId })
            .sort({ createdAt: 1 })
            .lean();

        // Use the same helper function for replies.
        const processedReplies = processComments(replies, userId);

        res.json(processedReplies);
    } catch (err) {
        console.error("Error fetching comment replies:", err);
        res.status(500).json({ error: 'Failed to fetch replies' });
    }
};

// atomic comment votes handler
const voteOnComment = async (req, res) => {
  // commendId from route params
  const { commentId } = req.params;
  const { value } = req.body;
  const userId = req.user.userId;

  if (![1, -1].includes(value)) {
    return res.status(400).json({ error: "Invalid vote value" });
  }

  try {
    const userKey = `votes.${userId}`;
    let result;

    // try to change an existing vote from -value to value
    result = await Comment.updateOne(
      { _id: commentId, [userKey]: -value },  // condition
      { $set: { [userKey]: value }, $inc: { voteCount: 2 * value } }
    );
    if (result.modifiedCount > 0) {
      const comment = await Comment.findById(commentId).select("voteCount").lean();
      return res.json({ voteCount: comment.voteCount });
    }

    // try to remove an existing vote of the same value
    result = await Comment.updateOne(
      { _id: commentId, [userKey]: value }, // condition
      { $unset: { [userKey]: "" }, $inc: { voteCount: -value } }
    );
    if (result.modifiedCount > 0) {
      const comment = await Comment.findById(commentId).select("voteCount").lean();
      return res.json({ voteCount: comment.voteCount });
    }

    // add a new vote
    result = await Comment.updateOne(
      { _id: commentId, [userKey]: { $exists: false } },
      { $set: { [userKey]: value }, $inc: { voteCount: value } }
    );

    const comment = await Comment.findById(commentId).select("voteCount").lean();
    res.json({ voteCount: comment.voteCount });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to vote on comment" });
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

    // hard delete if a comment has no replies
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
    // This is the ID of the user whose comments we are viewing.
    const { userId: profileUserId } = req.params;
    // This is the ID of the person who is doing the viewing (the logged-in user).
    const viewerId = req.user ? req.user.userId : null;

    try {
        const comments = await Comment.find({ author: profileUserId, deleted: false })
            .sort({ createdAt: -1 })
            .lean();

        // Process the comments using the viewer's ID to determine the vote status.
        const processedComments = processComments(comments, viewerId);

        res.json({ comments: processedComments });
    } catch (err) {
        console.error("Error fetching user comments:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createComment, getPostComments, getCommentReplies, voteOnComment, editComment, deleteComment, getCommentsByUser };