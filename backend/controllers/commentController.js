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
  // postId from route params
  const { postId } = req.params;

  try {
    // fetching all parent comments of the post by searching through the comments collection
    const comments = await Comment.find({ post: postId, parentComment: null })
      .sort({ createdAt: -1 });  // oldest to newest

    // sending the response
    res.json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch comments of the post' });
  }
};

// getting replies of a comment
const getCommentReplies = async (req, res) => {
  // commentId from route params
  const { commentId } = req.params;

  try {
    // fetching all replies by seraching through the comments collection
    const replies = await Comment.find({ parentComment: commentId })
      .sort({ createdAt: 1 });  // oldest to newest

    // sending the response
    res.json(replies);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
};

// atomic comment votes handler
const voteOnComment = async (req, res) => {
    // commendId from route params
    const { commentId } = req.params;
    const { value } = req.body;
    const userId = req.user.userId; // _id of the user

    // checking if the value is valid
    if (![1, -1].includes(value)) {
        return res.status(400).json({ error: 'Invalid vote value' });
    }

    try {
        let comment = null;

        // try to change an existing vote from -value to value
        let result = await Comment.updateOne(
            { _id: commentId, votes: { $elemMatch: { user: userId, value: -value } } },
            { $set: { "votes.$.value": value }, $inc: { voteCount: 2 * value } }
        );
        if (result.modifiedCount > 0) {
            comment = await Comment.findById(commentId).select('voteCount').lean();
            return res.json({ voteCount: comment.voteCount });
        }

        // try to remove an existing vote of the same value
        result = await Comment.updateOne(
            { _id: commentId, votes: { $elemMatch: { user: userId, value: value } } },
            { $pull: { votes: { user: userId } }, $inc: { voteCount: -value } }
        );
        if (result.modifiedCount > 0) {
            comment = await Comment.findById(commentId).select('voteCount').lean();
            return res.json({ voteCount: comment.voteCount });
        }
        
        // add a new vote
        result = await Comment.updateOne(
            { _id: commentId, "votes.user": { $ne: userId } },
            { $push: { votes: { user: userId, value } }, $inc: { voteCount: value } }
        );

        comment = await Comment.findById(commentId).select('voteCount').lean();
        
        res.json({ voteCount: comment.voteCount });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to vote on comment' });
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
  const { userId } = req.params;

  try {
    const comments = await Comment.find({ author: userId, deleted: false })
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (err) {
    console.error("Error fetching user comments:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createComment, getPostComments, getCommentReplies, voteOnComment, editComment, deleteComment, getCommentsByUser };