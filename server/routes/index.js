const express = require('express');
const router = express.Router();

// Routes
router.use('/mosques', require('./mosques'));
router.use('/quran', require('./quran'));

module.exports = router;