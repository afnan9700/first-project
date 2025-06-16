const express = require('express');
const { createComment, getPostComments, getCommentReplies, voteOnComment } = require('../controllers/commentController');
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get('/posts/:postId/comments', getPostComments);
router.get('/comments/:commentId/replies', getCommentReplies);
router.post('/posts/:postId/comments', requireAuth, createComment);
router.post('/comments/:commentId/vote', requireAuth, voteOnComment);

module.exports = router;
