const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/role');
const {
  list,
  create,
  createRecurring,
  updateStatus,
  replaceEmployee,
  getReport,
  getById,
  update,
  remove,
  removeByClient
} = require('../controllers/scheduleController');

router.use(authMiddleware);
router.get('/', list);
router.get('/report', getReport);
router.post('/', roleMiddleware('admin', 'supervisor'), create);
router.post('/recurring', roleMiddleware('admin', 'supervisor'), createRecurring);
router.post('/replace-employee', roleMiddleware('admin', 'supervisor'), replaceEmployee);
router.delete('/client/:client_id', roleMiddleware('admin', 'supervisor'), removeByClient);
router.get('/:id', getById);
router.put('/:id', roleMiddleware('admin', 'supervisor'), update);
router.delete('/:id', roleMiddleware('admin'), remove);
router.patch('/:id/status', updateStatus);

module.exports = router;