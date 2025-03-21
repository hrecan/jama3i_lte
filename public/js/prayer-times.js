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
        
        if (data && data[0]) {
            getPrayerTimes(data[0].lat, data[0].lon);
            document.getElementById("city-name").innerHTML = cityInput;
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
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
        const data = await response.json();
        document.getElementById("city-name").innerHTML = data.address.city || data.address.town || data.address.village || "Ville inconnue";
        getPrayerTimes(position.coords.latitude, position.coords.longitude);
    } catch (error) {
        console.error("Erreur lors de la récupération de la ville:", error);
        document.getElementById("city-name").innerHTML = "Erreur de localisation";
    }
}

// Fonction pour gérer les erreurs de géolocalisation
function showError(error) {
    let message = "";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = "Accès à la localisation refusé";
            showManualLocationInput();
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Position non disponible";
            showManualLocationInput();
            break;
        case error.TIMEOUT:
            message = "Délai d'attente dépassé";
            showManualLocationInput();
            break;
        default:
            message = "Erreur inconnue";
            showManualLocationInput();
    }
    console.error("Erreur de géolocalisation:", message);
}

// Fonction pour obtenir les horaires de prière
async function getPrayerTimes(latitude, longitude) {
    try {
        const date = new Date();
        const response = await fetch(`http://api.aladhan.com/v1/timings/${date.getTime()/1000}?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await response.json();
        const timings = data.data.timings;

        // Mettre à jour les horaires de prière
        document.getElementById("fajr-time").innerHTML = timings.Fajr;
        document.getElementById("dhuhr-time").innerHTML = timings.Dhuhr;
        document.getElementById("asr-time").innerHTML = timings.Asr;
        document.getElementById("maghrib-time").innerHTML = timings.Maghrib;
        document.getElementById("isha-time").innerHTML = timings.Isha;

        // Mettre à jour la prochaine prière
        updateNextPrayer(timings);
    } catch (error) {
        console.error("Erreur lors de la récupération des horaires:", error);
    }
}

// Fonction pour mettre à jour la prochaine prière
function updateNextPrayer(timings) {
    const prayers = [
        { name: "Fajr", time: timings.Fajr },
        { name: "Dhuhr", time: timings.Dhuhr },
        { name: "Asr", time: timings.Asr },
        { name: "Maghrib", time: timings.Maghrib },
        { name: "Isha", time: timings.Isha }
    ];

    const now = new Date();
    let nextPrayer = null;
    let minDiff = Infinity;

    prayers.forEach(prayer => {
        const [hours, minutes] = prayer.time.split(':');
        const prayerTime = new Date();
        prayerTime.setHours(parseInt(hours), parseInt(minutes), 0);

        let diff = prayerTime - now;
        if (diff < 0) {
            // Si la prière est passée, on ajoute 24h
            diff += 24 * 60 * 60 * 1000;
        }

        if (diff < minDiff) {
            minDiff = diff;
            nextPrayer = prayer;
        }
    });

    if (nextPrayer) {
        document.getElementById("next-prayer-name").innerHTML = nextPrayer.name;
        document.getElementById("next-prayer-time").innerHTML = nextPrayer.time;
        
        // Mettre à jour le temps restant
        updateTimeRemaining(nextPrayer.time);
    }
}

// Fonction pour mettre à jour le temps restant
function updateTimeRemaining(prayerTime) {
    const [hours, minutes] = prayerTime.split(':');
    const prayerDate = new Date();
    prayerDate.setHours(parseInt(hours), parseInt(minutes), 0);

    let diff = prayerDate - new Date();
    if (diff < 0) {
        diff += 24 * 60 * 60 * 1000;
    }

    const minutesRemaining = Math.floor(diff / (1000 * 60));
    const timeRemainingElement = document.getElementById("time-remaining");
    
    if (minutesRemaining <= 30) {
        timeRemainingElement.classList.add("urgent");
    } else {
        timeRemainingElement.classList.remove("urgent");
    }

    if (minutesRemaining < 60) {
        timeRemainingElement.innerHTML = `Dans ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`;
    } else {
        const hours = Math.floor(minutesRemaining / 60);
        const mins = minutesRemaining % 60;
        timeRemainingElement.innerHTML = `Dans ${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
}

// Initialiser la géolocalisation et l'heure au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    getLocation();
    updateDateTime();
});

// Mettre à jour l'heure chaque minute
setInterval(updateDateTime, 60000);

// Mettre à jour le temps restant toutes les minutes
setInterval(() => {
    const nextPrayerTime = document.getElementById("next-prayer-time").innerHTML;
    if (nextPrayerTime !== "--:--") {
        updateTimeRemaining(nextPrayerTime);
    }
}, 60000);