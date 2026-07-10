const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/role');
const { list, create, update, remove } = require('../controllers/userController');

// Apenas admin pode acessar estas rotas
router.get('/', authMiddleware, roleMiddleware('admin'), list);
router.post('/', authMiddleware, roleMiddleware('admin'), create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), remove);

module.exports = router;