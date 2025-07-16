const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { getFeed } = require('../controllers/feedController');

const router = express.Router();

// GET /api/feed?cursor=<postId>&limit=10&sort=new
router.get('/', requireAuth, getFeed);

module.exports = router;