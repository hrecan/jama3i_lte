class MosqueFinder {
    constructor() {
        console.log('Initialisation de MosqueFinder...');
        
        // Éléments DOM
        this.mapElement = document.getElementById('gmap');
        this.mosqueListElement = document.getElementById('mosque-list');
        
        if (!this.mapElement || !this.mosqueListElement) {
            throw new Error('Éléments DOM manquants');
        }
        console.log('Éléments DOM trouvés, démarrage de l\'initialisation...');

        // Initialisation des propriétés
        this.map = null;
        this.userMarker = null;
        this.mosqueMarkers = [];
        this.userPosition = null;
        this.searchRadius = 5000; // 5km en mètres
        this.directionsService = null;
        this.directionsRenderer = null;

        // Initialisation
        this.init();
    }

    async init() {
        try {
            console.log('Obtention de la position de l\'utilisateur...');
            await this.getUserLocation();
            
            console.log('Position utilisateur:', this.userPosition);
            
            console.log('Initialisation de la carte...');
            await this.initMap();
            
            // Initialiser le service de directions
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer({
                map: this.map,
                suppressMarkers: true
            });
            
            console.log('Recherche des mosquées...');
            await this.searchNearbyMosques();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showError(error.message);
        }
    }

    async getUserLocation() {
        return new Promise((resolve, reject) => {
            console.log('Début de la géolocalisation...');
            console.log('Hostname:', window.location.hostname);
            console.log('isSecureContext:', window.isSecureContext);
            
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            console.log('isLocalhost:', isLocalhost);
            
            if (!isLocalhost && !window.isSecureContext) {
                console.warn('La géolocalisation nécessite HTTPS en production');
                this.userPosition = window.APP_CONFIG.DEFAULT_LOCATION;
                resolve(this.userPosition);
                return;
            }

            if (!navigator.geolocation) {
                console.warn('Géolocalisation non supportée par ce navigateur');
                this.userPosition = window.APP_CONFIG.DEFAULT_LOCATION;
                resolve(this.userPosition);
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            console.log('Demande de la position...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Position obtenue avec succès:', position);
                    this.userPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(this.userPosition);
                },
                (error) => {
                    console.warn('Erreur détaillée de géolocalisation:', {
                        code: error.code,
                        message: error.message,
                        PERMISSION_DENIED: error.PERMISSION_DENIED,
                        POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                        TIMEOUT: error.TIMEOUT
                    });

                    let errorMessage = 'Erreur de géolocalisation: ';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'L\'utilisateur a refusé la demande de géolocalisation.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'L\'information de localisation n\'est pas disponible.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'La demande de géolocalisation a expiré.';
                            break;
                        default:
                            errorMessage += 'Une erreur inconnue est survenue.';
                    }
                    console.warn(errorMessage);
                    
                    this.userPosition = window.APP_CONFIG.DEFAULT_LOCATION;
                    resolve(this.userPosition);
                },
                options
            );
        });
    }

    async initMap() {
        try {
            console.log('Création de la carte avec la position:', this.userPosition);
            const mapOptions = {
                center: this.userPosition,
                zoom: 12,
                mapTypeControl: false,
                fullscreenControl: true,
                streetViewControl: true,
                mapId: '77dea9be8eb011ee'
            };

            this.map = new google.maps.Map(this.mapElement, mapOptions);
            console.log('Carte créée avec succès');

            // Créer le style du marqueur utilisateur
            const userPinView = new google.maps.marker.PinView({
                background: '#4285F4',
                borderColor: '#FFFFFF',
                glyphColor: '#FFFFFF',
                glyph: '📍',
            });

            // Ajouter le marqueur utilisateur
            this.userMarker = new google.maps.marker.AdvancedMarkerElement({
                map: this.map,
                position: this.userPosition,
                title: 'Votre position',
                content: userPinView.element
            });

            console.log('Carte initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la carte:', error);
            throw error;
        }
    }

    async searchNearbyMosques() {
        try {
            console.log('🕌 Recherche des mosquées en cours...');
            
            // Création du service Places
            const service = new google.maps.places.PlacesService(this.map);
            
            // Configuration de la recherche
            const request = {
                location: new google.maps.LatLng(this.userPosition.lat, this.userPosition.lng),
                types: ['mosque', 'place_of_worship'],
                rankBy: google.maps.places.RankBy.DISTANCE,
                keyword: 'mosque OR mosquée OR masjid'
            };

            // Effectuer la recherche
            service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    console.log(`${results.length} mosquées trouvées au total`);
                    
                    // Filtrer les résultats par distance et limiter à 3
                    const nearbyMosques = results
                        .filter(place => {
                            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                                new google.maps.LatLng(this.userPosition.lat, this.userPosition.lng),
                                place.geometry.location
                            );
                            return distance <= this.searchRadius;
                        })
                        .slice(0, 3); // Limiter à 3 mosquées

                    if (nearbyMosques.length > 0) {
                        this.displayMosques(nearbyMosques);
                    } else {
                        this.showError('Aucune mosquée trouvée dans un rayon de 5km');
                    }
                } else {
                    console.error('Erreur lors de la recherche des mosquées:', status);
                    let errorMessage = 'Impossible de trouver des mosquées à proximité';
                    
                    switch (status) {
                        case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
                            errorMessage = 'Aucune mosquée trouvée dans cette zone';
                            break;
                        case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
                            errorMessage = 'Limite de requêtes dépassée, veuillez réessayer plus tard';
                            break;
                        case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
                            errorMessage = 'Requête refusée. Vérifiez votre clé API';
                            break;
                    }
                    
                    this.showError(errorMessage);
                }
            });
        } catch (error) {
            console.error('Erreur lors de la recherche des mosquées:', error);
            this.showError('Une erreur est survenue lors de la recherche des mosquées');
        }
    }

    async displayMosques(mosques) {
        // Nettoyer les anciens marqueurs
        this.clearMosqueMarkers();
        
        // Vider la liste des mosquées
        this.mosqueListElement.innerHTML = '';

        // Style pour les marqueurs de mosquées
        const mosquePinView = new google.maps.marker.PinView({
            background: '#4CAF50',
            borderColor: '#FFFFFF',
            glyphColor: '#FFFFFF',
            glyph: '🕌',
        });

        // Service pour obtenir les détails
        const service = new google.maps.places.PlacesService(this.map);

        // Traiter chaque mosquée
        for (const mosque of mosques) {
            try {
                // Obtenir les détails de la mosquée
                const details = await new Promise((resolve, reject) => {
                    service.getDetails({
                        placeId: mosque.place_id,
                        fields: ['website', 'formatted_address', 'address_components']
                    }, (result, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            resolve(result);
                        } else {
                            reject(new Error('Impossible d\'obtenir les détails de la mosquée'));
                        }
                    });
                });

                // Créer le marqueur
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    map: this.map,
                    position: mosque.geometry.location,
                    title: mosque.name,
                    content: mosquePinView.element
                });

                this.mosqueMarkers.push(marker);

                // Calculer la distance
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(this.userPosition.lat, this.userPosition.lng),
                    mosque.geometry.location
                );

                // Créer l'élément de la liste
                const mosqueElement = document.createElement('div');
                mosqueElement.className = 'mosque-item';
                mosqueElement.innerHTML = `

                <button class="directions-button" data-lat="${mosque.geometry.location.lat()}" data-lng="${mosque.geometry.location.lng()}">
                    <h3>${mosque.name}</h3>
                    <p class="address">${details.formatted_address || 'Adresse non disponible'}</p>
                    <p class="distance">${Math.round(distance / 100) / 10} km</p>
                </button>
                `;

                // Ajouter l'événement pour le bouton d'itinéraire
                const directionsButton = mosqueElement.querySelector('.directions-button');
                directionsButton.addEventListener('click', () => {
                    this.showDirections(mosque.geometry.location);
                });

                this.mosqueListElement.appendChild(mosqueElement);

            } catch (error) {
                console.error('Erreur lors de l\'affichage de la mosquée:', error);
            }
        }
    }

    async showDirections(destination) {
        try {
            // Effacer l'itinéraire précédent s'il existe
            this.directionsRenderer.setMap(null);
            this.directionsRenderer = new google.maps.DirectionsRenderer({
                map: this.map,
                suppressMarkers: true
            });

            const request = {
                origin: new google.maps.LatLng(this.userPosition.lat, this.userPosition.lng),
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            };

            const result = await new Promise((resolve, reject) => {
                this.directionsService.route(request, (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        resolve(result);
                    } else {
                        reject(new Error('Impossible de calculer l\'itinéraire'));
                    }
                });
            });

            this.directionsRenderer.setDirections(result);
            this.map.setZoom(15);
            
        } catch (error) {
            console.error('Erreur lors du calcul de l\'itinéraire:', error);
            this.showError('Impossible de calculer l\'itinéraire');
        }
    }

    clearMosqueMarkers() {
        this.mosqueMarkers.forEach(marker => {
            marker.map = null;
        });
        this.mosqueMarkers = [];
    }

    showError(message) {
        console.error('Erreur:', message);
        const errorHtml = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="location.reload()">
                    <i class="fas fa-sync-alt"></i> Réessayer
                </button>
            </div>
        `;
        if (this.mapElement) {
            this.mapElement.innerHTML = errorHtml;
        }
        if (this.mosqueListElement) {
            this.mosqueListElement.innerHTML = '';
        }
    }
}