const express = require('express');
const { deleteUser, getUserById } = require('../controllers/userController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.delete("/me", requireAuth, deleteUser);
router.get('/:userId', getUserById);

modules.export = router;