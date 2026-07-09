const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/role');
const {
  list,
  create,
  getById,
  update,
  remove,
  getSchedule
} = require('../controllers/employeeController');

router.use(authMiddleware);

router.get('/', list);
router.post('/', roleMiddleware('admin'), create);
router.get('/:id', getById);
router.put('/:id', roleMiddleware('admin'), update);
router.delete('/:id', roleMiddleware('admin'), remove);
router.get('/:id/schedule', getSchedule);

module.exports = router;