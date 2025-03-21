document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const cityName = document.querySelector('.city-info h2');
    const gregorianDate = document.querySelector('.gregorian');
    const hijriDate = document.querySelector('.hijri');

    // Fonction pour obtenir la ville à partir des coordonnées
    async function getCityFromCoords(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            const data = await response.json();
            return {
                city: data.address.city || data.address.town || data.address.village,
                country: data.address.country
            };
        } catch (error) {
            console.error('Erreur lors de la récupération de la ville:', error);
            return { city: 'Ville inconnue', country: 'Pays inconnu' };
        }
    }

    // Fonction pour formater la date
    function formatDates() {
        const now = new Date();
        
        // Date grégorienne
        const gregorianOptions = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric'
        };
        const gregorianStr = now.toLocaleDateString('fr-FR', gregorianOptions);
        gregorianDate.textContent = gregorianStr;

        // Date hijri (simulation - à remplacer par une vraie API)
        // Vous pouvez utiliser une bibliothèque comme hijri-date
        const hijriStr = "13 Ramadan 1445"; // À remplacer par le calcul réel
        hijriDate.textContent = hijriStr;
    }

    // Fonction principale pour obtenir la localisation
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    // Obtenir la ville
                    const locationInfo = await getCityFromCoords(latitude, longitude);
                    cityName.textContent = `${locationInfo.city}, ${locationInfo.country}`;
                    
                    // Mettre à jour les dates
                    formatDates();
                },
                (error) => {
                    console.error('Erreur de géolocalisation:', error);
                    cityName.textContent = 'Localisation non disponible';
                    formatDates(); // Afficher quand même les dates
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            cityName.textContent = 'Géolocalisation non supportée';
            formatDates(); // Afficher quand même les dates
        }
    }

    // Démarrer la géolocalisation
    getLocation();

    // Mettre à jour toutes les minutes
    setInterval(formatDates, 60000);
}); 