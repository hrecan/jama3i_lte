const bcrypt = require('bcrypt');
const db = require('../models/database');

async function verifyUser(email, password) {
    try {
        // Récupérer l'utilisateur par email
        const user = await db.getOne('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) {
            return null;
        }

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return null;
        }

        // Ne pas renvoyer le mot de passe
        delete user.password;
        return user;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
        return null;
    }
}

module.exports = {
    verifyUser
};
