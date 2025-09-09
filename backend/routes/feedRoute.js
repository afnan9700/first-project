const express = require('express');
const checkAuth = require('../middleware/checkAuth');
const { getFeed } = require('../controllers/feedController');

const router = express.Router();

// GET /api/feed?cursor=<postId>&limit=10&sort=new
router.get('/', checkAuth, getFeed);

module.exports = router;