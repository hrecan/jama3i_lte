const express = require('express');
const router = express.Router();
const { videoHelpers, courseHelpers } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Obtenir les vidéos d'un utilisateur
router.get('/videos/utilisateur/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        logger.info(`Récupération des vidéos de l'utilisateur: ${userId}`);
        
        const videos = await videoHelpers.getUserVideos(userId);
        res.json(videos);
    } catch (error) {
        logger.error('Erreur lors de la récupération des vidéos:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
    }
});

// Obtenir les cours d'un utilisateur
router.get('/courses/utilisateur/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        logger.info(`Récupération des cours de l'utilisateur: ${userId}`);
        
        const courses = await courseHelpers.getUserCourses(userId);
        res.json(courses);
    } catch (error) {
        logger.error('Erreur lors de la récupération des cours:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
    }
});

// Route pour obtenir tout le contenu de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        logger.info(`Récupération de tout le contenu de l'utilisateur: ${userId}`);
        
        // Récupérer tous les types de contenu
        const [videos, courses] = await Promise.all([
            videoHelpers.getUserVideos(userId),
            courseHelpers.getUserCourses(userId)
        ]);

        res.json({
            videos,
            courses
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération du contenu:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du contenu' });
    }
});

module.exports = router;
