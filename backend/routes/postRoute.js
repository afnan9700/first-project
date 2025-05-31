const express = require("express");

const router = express.Router();

const { createPost, getPostById, getPosts } = require("../controllers/postController");
const requireAuth = require("../middlewares/authMiddleware");

router.post("/", requireAuth, createPost);
router.get("/", getPosts);
router.get("/:postId", getPostById);

module.exports = router;