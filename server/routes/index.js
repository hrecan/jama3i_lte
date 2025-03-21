const express = require('express');
const router = express.Router();

// Routes de base
router.get('/', (req, res) => {
    res.json({ message: 'API Jama3i' });
});

// Routes principales
router.use('/mosques', require('./mosques'));
router.use('/quran', require('./quran'));

module.exports = router;