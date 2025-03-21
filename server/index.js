require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const mysql = require('mysql2/promise');
const dns = require('dns');
const dbConfig = require('./config/database');

// Forcer l'utilisation d'IPv4
dns.setDefaultResultOrder('ipv4first');

const app = express();
const port = process.env.PORT || 3000;

// Configuration de la base de données avec IPv4 et timeouts
const fullDbConfig = {
    ...dbConfig,
    connectTimeout: 30000,
    family: 4,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
};

// Log de la configuration
logger.info('Database config:', {
    host: fullDbConfig.host,
    user: fullDbConfig.user,
    database: fullDbConfig.database,
    port: fullDbConfig.port,
    family: fullDbConfig.family
});

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

// Routes API
app.use('/api/database', require('./routes/database-view'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mosques', require('./routes/mosques'));
app.use('/api/events', require('./routes/events'));
app.use('/api/invocations', require('./routes/invocations'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/quran', require('./routes/quran'));
app.use('/api/courses', require('./routes/courses'));

// Route racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

// Endpoint de santé qui ne dépend pas de la base de données
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Route API
app.get('/api/status', async (req, res) => {
    try {
        const connection = await mysql.createConnection(fullDbConfig);
        const [rows] = await connection.query('SELECT 1 as value');
        await connection.end();
        res.json({ message: 'API is running with database connection', data: rows });
    } catch (error) {
        logger.error('Database error:', error);
        res.json({ 
            message: 'API is running without database connection', 
            error: error.message 
        });
    }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Serveur démarré sur le port ${PORT}`);
    logger.info('Database config:', {
        host: fullDbConfig.host,
        user: fullDbConfig.user,
        database: fullDbConfig.database,
        port: fullDbConfig.port,
        family: fullDbConfig.family
    });
});