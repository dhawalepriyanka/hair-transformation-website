const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, requireRole('admin'), createProduct);
router.put('/:id', verifyToken, requireRole('admin'), updateProduct);
router.delete('/:id', verifyToken, requireRole('admin'), deleteProduct);

module.exports = router;
