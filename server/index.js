const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 3000;

// Middleware de base
app.use(express.json());
app.use(cors());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/views', express.static(path.join(__dirname, '../public/views')));
app.use('/components', express.static(path.join(__dirname, '../public/views/components')));

// Point de contrôle pour Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Routes API essentielles
app.use('/api/mosques', require('./routes/mosques'));
app.use('/api/quran', require('./routes/quran'));

// Route racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Une erreur est survenue !' });
});

// Démarrer le serveur
app.listen(port, () => {
    logger.info(`Serveur démarré sur le port ${port}`);
});