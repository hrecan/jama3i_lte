const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/jama3i.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, username, email, role, created_at FROM users", [], (err, rows) => {
    if (err) {
        console.error('Erreur:', err);
        return;
    }
    
    console.log('Liste des utilisateurs:');
    console.log('----------------------');
    rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Username: ${row.username}`);
        console.log(`Email: ${row.email}`);
        console.log(`Role: ${row.role}`);
        console.log(`Créé le: ${row.created_at}`);
        console.log('----------------------');
    });
    
    db.close();
});
