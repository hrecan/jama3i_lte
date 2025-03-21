const express = require('express');
const router = express.Router();

// Importer les sous-routes
router.use('/users', require('./users'));
router.use('/mosques', require('./mosques'));
router.use('/videos', require('./videos'));
router.use('/invocations', require('./invocations'));
router.use('/donations', require('./donations'));

module.exports = router; 