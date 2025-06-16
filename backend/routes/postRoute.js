const express = require("express");

const router = express.Router();

const { createPost, getPostById, getPosts, voteOnPost } = require("../controllers/postController");
const requireAuth = require("../middlewares/authMiddleware");

router.post("/", requireAuth, createPost);
router.get("/", getPosts);
router.get("/:postId", getPostById);
router.post("/:postId/vote", requireAuth, voteOnPost);

module.exports = router;