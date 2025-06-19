const express = require('express');
const { createComment, getPostComments, getCommentReplies, voteOnComment, editComment, deleteComment } = require('../controllers/commentController');
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get('/posts/:postId/comments', getPostComments);
router.get('/comments/:commentId/replies', getCommentReplies);
router.post('/posts/:postId/comments', requireAuth, createComment);
router.post('/comments/:commentId/vote', requireAuth, voteOnComment);
router.patch('/comments/:commentId', requireAuth, editComment);
router.delete('/comments/:commentId', requireAuth, deleteComment);

module.exports = router;
