const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, getLowStock } = require('../controllers/productController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);
router.get('/low-stock', getLowStock);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
