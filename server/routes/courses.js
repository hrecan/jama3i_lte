const express = require('express');
const router = express.Router();
const { courseHelpers } = require('../models/database');
const { authenticateToken } = require('./auth');

// Obtenir tous les cours
router.get('/', async (req, res) => {
    try {
        const courses = await courseHelpers.getAllCourses();
        res.json(courses);
    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
    }
});

// Obtenir les cours par catégorie
router.get('/category/:category', async (req, res) => {
    try {
        const courses = await courseHelpers.getCoursesByCategory(req.params.category);
        res.json(courses);
    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
    }
});

// Obtenir les cours d'un utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const courses = await courseHelpers.getUserCourses(req.params.userId);
        res.json(courses);
    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
    }
});

// Obtenir toutes les catégories
router.get('/categories', async (req, res) => {
    try {
        const categories = await courseHelpers.getCategories();
        res.json({ categories: categories });
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
    }
});

// Obtenir les vidéos
router.get('/videos', authenticateToken, async (req, res) => {
    try {
        const videos = await courseHelpers.getAllVideos();
        res.json(videos);
    } catch (error) {
        console.error('Erreur lors de la récupération des vidéos:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
    }
});

// Créer un nouveau cours
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, url, category } = req.body;

        if (!title || !url || !category) {
            return res.status(400).json({ error: 'Titre, URL et catégorie sont requis' });
        }

        const courseId = await courseHelpers.createCourse(
            title,
            description || '',
            url,
            category,
            req.user.id
        );

        res.status(201).json({ id: courseId, message: 'Cours créé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la création du cours:', error);
        res.status(500).json({ error: 'Erreur lors de la création du cours' });
    }
});

module.exports = router;
