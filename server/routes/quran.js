const express = require('express');
const router = express.Router();
const dataManager = require('../utils/dataManager');

// Route pour enregistrer l'historique d'écoute
router.post('/ghtushi', async (req, res) => {
    try {
        const { id_sourat, temps_ecoute, finich } = req.body;
        const id_user = 1; // Utilisateur de test

        console.log('Données reçues:', { id_user, id_sourat, temps_ecoute, finich });

        const progress = {
            id_user,
            id_sourat,
            temps_ecoute,
            finich,
            date: new Date().toISOString()
        };

        await dataManager.insert('quran.json', 'user_progress', progress);

        res.json({
            success: true,
            message: 'Historique enregistré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'historique:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement de l\'historique',
            error: error.message
        });
    }
});

// Route pour obtenir les statistiques d'écoute
router.get('/ghtushi', async (req, res) => {
    try {
        const id_user = 1; // Utilisateur de test

        const progress = await dataManager.query('quran.json', 'user_progress', 
            item => item.id_user === id_user
        );

        const stats = {
            completed_surahs: 0,
            total_unique_surahs: 0,
            total_listening_time: '00:00:00',
            completed_surah_ids: null,
            has_completed_surahs: false
        };

        if (progress.length > 0) {
            stats.completed_surahs = progress.filter(item => item.finich === 1).length;
            stats.total_unique_surahs = [...new Set(progress.map(item => item.id_sourat))].length;
            stats.total_listening_time = progress.reduce((acc, item) => acc + item.temps_ecoute, 0);
            stats.completed_surah_ids = progress.filter(item => item.finich === 1).map(item => item.id_sourat);
            stats.has_completed_surahs = progress.some(item => item.finich === 1);
        }

        console.log('Statistiques récupérées:', stats);

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

module.exports = router;
