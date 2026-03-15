const express = require('express');
const router = express.Router();
const { getAll, create, getStats } = require('../controllers/paddyController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);
router.get('/stats', getStats);
router.post('/', create);

module.exports = router;
