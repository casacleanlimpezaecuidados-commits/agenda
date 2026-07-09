const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { list } = require('../controllers/historyController');

router.use(authMiddleware);
router.get('/', list);

module.exports = router;