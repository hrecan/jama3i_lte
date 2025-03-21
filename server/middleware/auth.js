const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authenticateToken(req, res, next) {
    console.log('Headers reçus:', req.headers); // Log pour déboguer
    
    // Récupérer le token du header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');

    console.log('Token extrait:', token); // Log pour déboguer

    if (!token) {
        console.warn('Tentative d\'accès sans token');
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }

    try {
        // Vérifier le token
        const verified = jwt.verify(token, JWT_SECRET);
        console.log('Token vérifié:', verified); // Log pour déboguer
        req.user = verified;
        console.log(`Utilisateur ${verified.id} authentifié avec succès`);
        next();
    } catch (error) {
        console.error('Erreur de vérification du token:', error); // Log plus détaillé
        console.error('Token invalide:', error);
        res.status(401).json({ error: 'Token invalide' });
    }
}

module.exports = { authenticateToken };
