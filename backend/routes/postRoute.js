const express = require("express");
const { createPost, getPostById, getPosts, voteOnPost, editPost, deletePost, getPostsByUser } = require("../controllers/postController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, createPost);
router.get("/:postId", getPostById);
router.post("/:postId/vote", requireAuth, voteOnPost);
router.patch('/posts/:postId', requireAuth, editPost);
router.delete('/post/:postId', requireAuth, deletePost);
router.get('/user/:userId', getPostsByUser);

module.exports = router;