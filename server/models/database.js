const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const dbConfig = require('../config/database');

let pool;

// Initialisation de la connexion à la base de données
async function initDatabase() {
    try {
        // Créer le pool de connexions
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Vérifier la connexion
        const connection = await pool.getConnection();
        logger.info('Connecté à la base de données MySQL');
        connection.release();

    } catch (error) {
        logger.error('Erreur lors de l\'initialisation de la base de données:', error);
        throw error;
    }
}

// Fonctions utilitaires pour la base de données
async function query(sql, params = []) {
    logger.debug('Exécution de la requête SQL:', { sql, params });
    
    try {
        const [results] = await pool.query(sql, params);
        return results;
    } catch (error) {
        logger.error('Erreur SQL:', error);
        throw error;
    }
}

async function getOne(sql, params = []) {
    logger.debug('Exécution de getOne:', { sql, params });
    
    try {
        const results = await query(sql, params);
        return results[0];
    } catch (error) {
        logger.error('Erreur dans getOne:', error);
        throw error;
    }
}

// Fonctions d'aide pour les utilisateurs
const userHelpers = {
    async checkExistingUser(email) {
        return await getOne(
            'SELECT * FROM ghtusr WHERE us_email = ?',
            [email]
        );
    },

    async createUser(firstName, lastName, email, type = 'user') {
        const result = await query(
            'INSERT INTO ghtusr (us_fname, us_lname, us_email, us_type) VALUES (?, ?, ?, ?)',
            [firstName, lastName, email, type]
        );
        return result.insertId;
    },

    async verifyUser(email) {
        const user = await getOne(
            'SELECT * FROM ghtusr WHERE us_email = ?',
            [email]
        );
        return user;
    },

    async getUser(id) {
        return await getOne(
            'SELECT * FROM ghtusr WHERE us_id = ?',
            [id]
        );
    }
};

// Fonctions d'aide pour les vidéos
const videoHelpers = {
    async createVideo(titre, description, url, categorie, langue, auteurId) {
        const result = await query(
            'INSERT INTO GHTVID (vd_title, vd_desc, vd_url, vd_cate, vd_lang, vd_auth) VALUES (?, ?, ?, ?, ?, ?)',
            [titre, description, url, categorie, langue, auteurId]
        );
        return result.insertId;
    },

    async getAllVideos() {
        return await query(
            `SELECT v.*, CONCAT(u.us_fname, ' ', u.us_lname) as author_name 
            FROM GHTVID v 
            JOIN ghtusr u ON v.vd_auth = u.us_id 
            ORDER BY v.vd_date DESC`
        );
    },

    async getVideosByCategory(categorie) {
        return await query(
            `SELECT v.*, CONCAT(u.us_fname, ' ', u.us_lname) as author_name 
            FROM GHTVID v 
            JOIN ghtusr u ON v.vd_auth = u.us_id 
            WHERE v.vd_cate = ? 
            ORDER BY v.vd_date DESC`,
            [categorie]
        );
    },

    async getVideosByLanguage(langue) {
        return await query(
            `SELECT v.*, CONCAT(u.us_fname, ' ', u.us_lname) as author_name 
            FROM GHTVID v 
            JOIN ghtusr u ON v.vd_auth = u.us_id 
            WHERE v.vd_lang = ? 
            ORDER BY v.vd_date DESC`,
            [langue]
        );
    },

    async getUserVideos(userId) {
        return await query(
            'SELECT * FROM GHTVID WHERE vd_auth = ? ORDER BY vd_date DESC',
            [userId]
        );
    },

    async getVideo(id) {
        return await getOne(
            'SELECT * FROM GHTVID WHERE vd_id = ?',
            [id]
        );
    },

    async deleteVideo(id) {
        await query(
            'DELETE FROM GHTVID WHERE vd_id = ?',
            [id]
        );
    }
};

// Fonctions d'aide pour les cours
const courseHelpers = {
    async createCourse(title, description, category, authorId) {
        const sql = `
            INSERT INTO ghtvid (vd_title, vd_desc, vd_cate, vd_auth)
            VALUES (?, ?, ?, ?)
        `;
        const result = await query(sql, [title, description, category, authorId]);
        return result.insertId;
    },

    async getAllCourses() {
        const sql = `
            SELECT v.*, CONCAT(u.us_fname, ' ', u.us_lname) as author_name 
            FROM ghtvid v 
            LEFT JOIN ghtusr u ON v.vd_auth = u.us_id 
            ORDER BY v.vd_date DESC
        `;
        return await query(sql);
    },

    async getCoursesByCategory(category) {
        const sql = `
            SELECT v.*, CONCAT(u.us_fname, ' ', u.us_lname) as author_name 
            FROM ghtvid v 
            LEFT JOIN ghtusr u ON v.vd_auth = u.us_id 
            WHERE v.vd_cate = ?
            ORDER BY v.vd_date DESC
        `;
        return await query(sql, [category]);
    },

    async getUserCourses(userId) {
        const sql = `
            SELECT * FROM ghtvid 
            WHERE vd_auth = ?
            ORDER BY vd_date DESC
        `;
        return await query(sql, [userId]);
    },

    async getCategories() {
        const sql = `
            SELECT DISTINCT vd_cate 
            FROM ghtvid 
            WHERE vd_cate IS NOT NULL
        `;
        return await query(sql);
    }
};

// Fonctions d'aide pour les événements
const eventHelpers = {
    async createEvent(title, description, date, location, authorId) {
        const result = await query(
            'INSERT INTO GHTEVT (evt_title, evt_desc, evt_date, evt_loc, evt_auth) VALUES (?, ?, ?, ?, ?)',
            [title, description, date, location, authorId]
        );
        return result.insertId;
    },

    async getAllEvents() {
        return await query(
            `SELECT e.*, CONCAT(u.us_fname, ' ', u.us_lname) as author_name 
            FROM GHTEVT e 
            JOIN ghtusr u ON e.evt_auth = u.us_id 
            ORDER BY e.evt_date DESC`
        );
    },

    async getUserEvents(userId) {
        return await query(
            'SELECT * FROM GHTEVT WHERE evt_auth = ? ORDER BY evt_date DESC',
            [userId]
        );
    },

    async getEvent(id) {
        return await getOne(
            'SELECT * FROM GHTEVT WHERE evt_id = ?',
            [id]
        );
    }
};

// Initialiser la base de données au démarrage
initDatabase().catch(error => logger.error('Erreur d\'initialisation de la base de données:', error));

module.exports = {
    query,
    getOne,
    pool,
    userHelpers,
    courseHelpers,
    videoHelpers,
    eventHelpers
};
