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
  getAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  checkDuplicate
} = require('../controllers/clientController');

router.use(authMiddleware);

// Rota de verificação de duplicidade (ANTES das rotas com :id para não conflitar)
router.get('/check-duplicate', checkDuplicate);

// Rotas principais de clientes
router.get('/', list);
router.post('/', roleMiddleware('admin', 'supervisor'), create);
router.get('/:id', getById);
router.put('/:id', roleMiddleware('admin', 'supervisor'), update);
router.delete('/:id', roleMiddleware('admin'), remove);

// Rotas de endereços (específicas antes das genéricas)
router.get('/:id/addresses', getAddresses);
router.post('/:id/addresses', roleMiddleware('admin', 'supervisor'), addAddress);
router.put('/:id/addresses/:addressId', roleMiddleware('admin', 'supervisor'), updateAddress);
router.delete('/:id/addresses/:addressId', roleMiddleware('admin'), removeAddress);

module.exports = router;