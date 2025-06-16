const express = require("express");
const { createPost, getPostById, getPosts, voteOnPost } = require("../controllers/postController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, createPost);
router.get("/", getPosts);
router.get("/:postId", getPostById);
router.post("/:postId/vote", requireAuth, voteOnPost);

module.exports = router;