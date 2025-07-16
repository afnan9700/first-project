const express = require('express');
const { 
  createBoard,
  joinBoard,
  leaveBoard,
  getUserBoards,
  editBoard,
  promoteToModerator,
  kickMember,
  demoteSelf,
  deleteBoard 
} = require('../controllers/boardController');
const { getPostsByBoard } = require('../controllers/postController');
const requireAuth = require('../middleware/authMiddleware');
const requireModerator = require('../middleware/requireModerator');

const router = express.Router();

router.post('/create', requireAuth, createBoard);
router.get('/user/:userId', getUserBoards);
router.post('/:boardId/join', requireAuth, joinBoard);
router.post('/:boardId/leave', requireAuth, leaveBoard);
router.get('/board/:boardId', getPostsByBoard);
  
// mod related routes
router.patch('/board/:boardId', requireAuth, requireModerator, editBoard);
router.delete("/:boardId", requireAuth, requireModerator, deleteBoard);
router.post('/boards/:boardId/moderators/promote', requireAuth, requireModerator, promoteToModerator);
router.post('/boards/:boardId/moderators/demote-self', requireAuth, requireModerator, demoteSelf);
router.post('/boards/:boardId/kick', requireAuth, requireModerator, kickMember);

module.exports = router;