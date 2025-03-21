const express = require('express');
const router = express.Router();
const dataManager = require('../utils/dataManager');

// Données statiques pour les mosquées
const mosques = [
    {
        ms_id: 1,
        ms_name: "Mosquée de la Paix",
        ms_address: "123 Rue de la Paix",
        ms_city: "Paris",
        ms_phone: "+33123456789",
        ms_email: "contact@mosqueepaix.fr",
        ms_lat: 48.8566,
        ms_lng: 2.3522
    },
    {
        ms_id: 2,
        ms_name: "Grande Mosquée",
        ms_address: "456 Avenue Principale",
        ms_city: "Lyon",
        ms_phone: "+33987654321",
        ms_email: "contact@grandemosquee.fr",
        ms_lat: 45.7640,
        ms_lng: 4.8357
    }
];

// Obtenir toutes les mosquées
router.get('/', async (req, res) => {
    try {
        const mosquesData = await dataManager.query('mosques.json', 'mosques');
        res.json(mosquesData);
    } catch (error) {
        console.error('Error fetching mosques:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Obtenir une mosquée par ID
router.get('/:id', async (req, res) => {
    try {
        const mosqueId = parseInt(req.params.id);
        const mosquesData = await dataManager.query('mosques.json', 'mosques', 
            item => item.ms_id === mosqueId
        );
        
        if (mosquesData.length === 0) {
            return res.status(404).json({ error: 'Mosquée non trouvée' });
        }
        
        res.json(mosquesData[0]);
    } catch (error) {
        console.error('Error fetching mosque:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Créer une mosquée
router.post('/', async (req, res) => {
    try {
        const { ms_name, ms_address, ms_city, ms_phone, ms_email, ms_lat, ms_lng } = req.body;
        
        // Validation des données
        if (!ms_name || !ms_address || !ms_city) {
            return res.status(400).json({
                status: 'error',
                message: 'Nom, adresse et ville sont requis'
            });
        }

        // Créer une nouvelle mosquée
        const newMosque = {
            ms_id: mosques.length + 1,
            ms_name,
            ms_address,
            ms_city,
            ms_phone,
            ms_email,
            ms_lat,
            ms_lng
        };

        // Ajouter à la liste
        await dataManager.add('mosques.json', 'mosques', newMosque);

        res.status(201).json({
            status: 'success',
            message: 'Mosquée créée avec succès',
            data: newMosque
        });
    } catch (error) {
        console.error('Error creating mosque:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mettre à jour une mosquée
router.put('/:id', async (req, res) => {
    try {
        const mosqueId = parseInt(req.params.id);
        const mosquesData = await dataManager.query('mosques.json', 'mosques', 
            item => item.ms_id === mosqueId
        );
        
        if (mosquesData.length === 0) {
            return res.status(404).json({ error: 'Mosquée non trouvée' });
        }

        // Mettre à jour la mosquée
        const updatedMosque = {
            ...mosquesData[0],
            ...req.body,
            ms_id: mosqueId // Garder l'ID original
        };

        await dataManager.update('mosques.json', 'mosques', updatedMosque);

        res.json({
            status: 'success',
            message: 'Mosquée mise à jour avec succès',
            data: updatedMosque
        });
    } catch (error) {
        console.error('Error updating mosque:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Supprimer une mosquée
router.delete('/:id', async (req, res) => {
    try {
        const mosqueId = parseInt(req.params.id);
        const mosquesData = await dataManager.query('mosques.json', 'mosques', 
            item => item.ms_id === mosqueId
        );
        
        if (mosquesData.length === 0) {
            return res.status(404).json({ error: 'Mosquée non trouvée' });
        }

        // Supprimer la mosquée
        await dataManager.remove('mosques.json', 'mosques', mosqueId);

        res.json({
            status: 'success',
            message: 'Mosquée supprimée avec succès'
        });
    } catch (error) {
        console.error('Error deleting mosque:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;