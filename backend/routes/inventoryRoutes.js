const express = require('express');
const router = express.Router();
const { getDashboard, getMovements } = require('../controllers/inventoryController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getDashboard);
router.get('/movements', getMovements);

module.exports = router;
