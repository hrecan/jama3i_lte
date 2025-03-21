const config = {
    // Détecter si nous sommes en production ou en développement
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    
    // Configuration de l'API
    get API_BASE_URL() {
        return this.isProduction
            ? 'https://' + window.location.host + '/api'
            : 'http://localhost:3000/api';
    },

    // Configuration de Google Maps
    GOOGLE_MAPS_KEY: 'AIzaSyDSMTbborfzElgcKx8NIiAaY-7qMsffp8s',
    
    // Configuration de la géolocalisation
    DEFAULT_LOCATION: {
        lat: 48.8566,
        lng: 2.3522
    }
};

// Pour rendre config accessible globalement
window.APP_CONFIG = config;
