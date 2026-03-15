const express = require('express');
const router = express.Router();
const { createSale, getAll, getById, getTodayStats } = require('../controllers/salesController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);
router.get('/today', getTodayStats);
router.get('/:id', getById);
router.post('/', createSale);

module.exports = router;
