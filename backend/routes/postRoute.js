const express = require("express");
const { createPost, getPostById, getPosts, voteOnPost, editPost, deletePost } = require("../controllers/postController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, createPost);
router.get("/", getPosts);
router.get("/:postId", getPostById);
router.post("/:postId/vote", requireAuth, voteOnPost);
router.patch('/posts/:postId', requireAuth, editPost);
router.delete('/post/:postId', requireAuth, deletePost);

module.exports = router;