const express = require('express');
const router = express.Router();
const { getStock, updateStock, addStock, createSale, getSales } = require('../controllers/branController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/stock', getStock);
router.put('/stock', updateStock);
router.post('/stock/add', addStock);
router.get('/sales', getSales);
router.post('/sales', createSale);

module.exports = router;
