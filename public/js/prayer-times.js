// Fonction pour mettre à jour l'heure et la date
function updateDateTime() {
    const now = new Date();
    
    // Mise à jour de l'heure
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    
    // Mise à jour de la date
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    document.getElementById('current-date').textContent = `${day}/${month}/${year}`;
}

// Fonction pour obtenir la position de l'utilisateur
function getLocation() {
    if (navigator.geolocation) {
        // Options de géolocalisation pour plus de précision
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        // Tentative de géolocalisation
        navigator.geolocation.getCurrentPosition(showPosition, showError, options);
        
        // Afficher un message de chargement
        document.getElementById("city-name").innerHTML = "Recherche de votre position...";
    } else {
        showManualLocationInput();
    }
}

// Fonction pour afficher l'entrée manuelle de la ville
function showManualLocationInput() {
    const cityContainer = document.getElementById("city-name").parentElement;
    cityContainer.innerHTML = `
        <input type="text" id="manual-city" placeholder="Entrez votre ville" class="form-control">
        <button onclick="searchCity()" class="btn btn-primary mt-2">Rechercher</button>
    `;
}

// Fonction pour rechercher une ville manuellement
async function searchCity() {
    const cityInput = document.getElementById("manual-city").value;
    if (!cityInput) return;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            document.getElementById("city-name").innerHTML = cityInput;
            getPrayerTimes(data[0].lat, data[0].lon);
        } else {
            document.getElementById("city-name").innerHTML = "Ville non trouvée";
        }
    } catch (error) {
        console.error("Erreur lors de la recherche de la ville:", error);
        document.getElementById("city-name").innerHTML = "Erreur de recherche";
    }
}

// Fonction pour afficher la position et obtenir le nom de la ville
async function showPosition(position) {
    try {
        // Utiliser l'API de géocodage inversé avec des en-têtes appropriés
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`, {
            headers: {
                'User-Agent': 'Jama3i_LTE/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const cityName = data.address.city || data.address.town || data.address.village || "Ville inconnue";
        document.getElementById("city-name").innerHTML = cityName;
        
        // Sauvegarder la position et le nom de la ville
        localStorage.setItem('lastKnownLocation', JSON.stringify({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: cityName,
            timestamp: Date.now()
        }));
        
        getPrayerTimes(position.coords.latitude, position.coords.longitude);
    } catch (error) {
        console.error("Erreur lors de la récupération de la ville:", error);
        // Essayer d'utiliser la dernière position connue
        const lastLocation = localStorage.getItem('lastKnownLocation');
        if (lastLocation) {
            const location = JSON.parse(lastLocation);
            const timeSinceLastUpdate = Date.now() - location.timestamp;
            if (timeSinceLastUpdate < 24 * 60 * 60 * 1000) { // Moins de 24h
                document.getElementById("city-name").innerHTML = location.city;
                getPrayerTimes(location.lat, location.lon);
                return;
            }
        }
        document.getElementById("city-name").innerHTML = "Erreur de localisation";
        showManualLocationInput();
    }
}

// Fonction pour gérer les erreurs de géolocalisation
function showError(error) {
    let message = "";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = "Accès à la localisation refusé";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Position non disponible";
            break;
        case error.TIMEOUT:
            message = "Délai d'attente dépassé";
            break;
        default:
            message = "Erreur inconnue";
    }
    console.error("Erreur de géolocalisation:", message);
    
    // Essayer d'utiliser la dernière position connue
    const lastLocation = localStorage.getItem('lastKnownLocation');
    if (lastLocation) {
        const location = JSON.parse(lastLocation);
        const timeSinceLastUpdate = Date.now() - location.timestamp;
        if (timeSinceLastUpdate < 24 * 60 * 60 * 1000) { // Moins de 24h
            document.getElementById("city-name").innerHTML = location.city;
            getPrayerTimes(location.lat, location.lon);
            return;
        }
    }
    
    document.getElementById("city-name").innerHTML = message;
    showManualLocationInput();
}

// Fonction pour obtenir les horaires de prière
async function getPrayerTimes(latitude, longitude) {
    try {
        const date = new Date();
        const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(date.getTime()/1000)}?latitude=${latitude}&longitude=${longitude}&method=2`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data || !data.data || !data.data.timings) {
            throw new Error('Format de réponse invalide');
        }
        
        const timings = data.data.timings;

        // Mettre à jour les horaires de prière
        document.getElementById("fajr-time").innerHTML = timings.Fajr;
        document.getElementById("dhuhr-time").innerHTML = timings.Dhuhr;
        document.getElementById("asr-time").innerHTML = timings.Asr;
        document.getElementById("maghrib-time").innerHTML = timings.Maghrib;
        document.getElementById("isha-time").innerHTML = timings.Isha;

        // Mettre à jour la prochaine prière
        updateNextPrayer(timings);
        
        // Sauvegarder les horaires
        localStorage.setItem('lastPrayerTimes', JSON.stringify({
            timings,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des horaires:", error);
        
        // Essayer d'utiliser les derniers horaires connus
        const lastPrayerTimes = localStorage.getItem('lastPrayerTimes');
        if (lastPrayerTimes) {
            const savedTimes = JSON.parse(lastPrayerTimes);
            const timeSinceLastUpdate = Date.now() - savedTimes.timestamp;
            if (timeSinceLastUpdate < 24 * 60 * 60 * 1000) { // Moins de 24h
                const timings = savedTimes.timings;
                document.getElementById("fajr-time").innerHTML = timings.Fajr;
                document.getElementById("dhuhr-time").innerHTML = timings.Dhuhr;
                document.getElementById("asr-time").innerHTML = timings.Asr;
                document.getElementById("maghrib-time").innerHTML = timings.Maghrib;
                document.getElementById("isha-time").innerHTML = timings.Isha;
                updateNextPrayer(timings);
                return;
            }
        }
        
        // Afficher des tirets si aucune donnée n'est disponible
        document.getElementById("fajr-time").innerHTML = "--:--";
        document.getElementById("dhuhr-time").innerHTML = "--:--";
        document.getElementById("asr-time").innerHTML = "--:--";
        document.getElementById("maghrib-time").innerHTML = "--:--";
        document.getElementById("isha-time").innerHTML = "--:--";
        document.getElementById("next-prayer-name").innerHTML = "Indisponible";
        document.getElementById("next-prayer-time").innerHTML = "--:--";
        document.getElementById("time-remaining").innerHTML = "Erreur de connexion";
    }
}

// Fonction pour mettre à jour la prochaine prière
function updateNextPrayer(timings) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const prayers = [
        { name: 'Fajr', time: timings.Fajr },
        { name: 'Dhuhr', time: timings.Dhuhr },
        { name: 'Asr', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isha', time: timings.Isha }
    ];
    
    let nextPrayer = null;
    for (const prayer of prayers) {
        if (prayer.time > currentTime) {
            nextPrayer = prayer;
            break;
        }
    }
    
    // Si aucune prière n'est trouvée, c'est que la prochaine est Fajr demain
    if (!nextPrayer) {
        nextPrayer = prayers[0];
    }
    
    document.getElementById("next-prayer-name").innerHTML = nextPrayer.name;
    document.getElementById("next-prayer-time").innerHTML = nextPrayer.time;
    
    // Mettre à jour le temps restant
    updateTimeRemaining(nextPrayer.time);
}

// Fonction pour mettre à jour le temps restant
function updateTimeRemaining(prayerTime) {
    const now = new Date();
    const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
    const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), prayerHours, prayerMinutes);
    
    if (prayerDate < now) {
        prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const timeDiff = prayerDate - now;
    const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let remainingText = '';
    if (hoursRemaining > 0) {
        remainingText = `Dans ${hoursRemaining}h ${minutesRemaining}min`;
    } else {
        remainingText = `Dans ${minutesRemaining} minutes`;
    }
    
    document.getElementById("time-remaining").innerHTML = remainingText;
}

// Initialiser la géolocalisation et l'heure au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    getLocation();
    updateDateTime();
    
    // Mettre à jour l'heure toutes les minutes
    setInterval(updateDateTime, 60000);
    
    // Mettre à jour le temps restant toutes les minutes
    setInterval(() => {
        const nextPrayerTime = document.getElementById("next-prayer-time").innerHTML;
        if (nextPrayerTime !== "--:--") {
            updateTimeRemaining(nextPrayerTime);
        }
    }, 60000);
});