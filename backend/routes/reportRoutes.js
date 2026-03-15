const express = require('express');
const router = express.Router();
const { salesReport, purchaseReport, profitReport, dashboard } = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/dashboard', dashboard);
router.get('/sales', salesReport);
router.get('/purchases', purchaseReport);
router.get('/profit', profitReport);

module.exports = router;
