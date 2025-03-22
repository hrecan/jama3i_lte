const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/data', express.static(path.join(__dirname, '../public/data')));
app.use('/data/translations', express.static(path.join(__dirname, '../public/data/translations')));

// Routes API
app.use('/api', routes);

// Route pour la page du quiz
app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/quiz.html'));
});

// Route par défaut pour le frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Une erreur est survenue !' });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
