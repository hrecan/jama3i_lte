document.addEventListener('DOMContentLoaded', function() {
    // Animation du titre de bienvenue
    const welcomeTitle = document.querySelector('.welcome-section h1');
    welcomeTitle.style.opacity = '0';
    
    setTimeout(() => {
        welcomeTitle.style.transition = 'opacity 1s ease-in';
        welcomeTitle.style.opacity = '1';
    }, 500);

    // Gestion du bouton CTA
    const ctaButton = document.querySelector('.cta-button');
    ctaButton.addEventListener('click', function() {
        alert('Bienvenue dans notre mosquée ! Nous sommes heureux de vous accueillir.');
    });

    // Ajout de la classe active au lien de navigation actuel
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Tableau de versets coraniques
    const verses = [
        "﴿ إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ﴾",
        "﴿ وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا لَعَلَّكُمْ تُرْحَمُونَ ﴾",
        "﴿ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا ﴾",
        "﴿ وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا ﴾",
        "﴿ إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ ﴾"
    ];

    // Fonction pour mettre à jour les versets
    function updateVerses() {
        const scrollContainer = document.querySelector('.quran-scroll');
        scrollContainer.innerHTML = '';
        
        // Dupliquer les versets pour un défilement continu
        verses.forEach(verse => {
            const span = document.createElement('span');
            span.textContent = verse;
            scrollContainer.appendChild(span);
        });
    }

    // Initialiser les versets
    updateVerses();

    // Réinitialiser l'animation quand elle se termine
    const scrollContainer = document.querySelector('.quran-scroll');
    scrollContainer.addEventListener('animationend', () => {
        scrollContainer.style.animation = 'none';
        setTimeout(() => {
            scrollContainer.style.animation = 'scrollQuran 30s linear infinite';
        }, 10);
    });

    // Fonction pour obtenir la ville actuelle
    async function getCurrentCity() {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            return data.address.city || data.address.town || data.address.village;
        } catch (error) {
            console.error('Erreur de géolocalisation:', error);
            return 'Ville non trouvée';
        }
    }

    // Fonction pour calculer la prochaine prière
    function getNextPrayer() {
        const now = new Date();
        const prayerTimes = {
            fajr: new Date(now.setHours(5, 30, 0)),
            dhuhr: new Date(now.setHours(13, 15, 0)),
            asr: new Date(now.setHours(16, 45, 0)),
            maghrib: new Date(now.setHours(19, 30, 0)),
            isha: new Date(now.setHours(21, 0, 0))
        };

        const currentTime = new Date();
        let nextPrayer = null;
        let nextPrayerTime = null;

        for (const [prayer, time] of Object.entries(prayerTimes)) {
            if (time > currentTime) {
                nextPrayer = prayer;
                nextPrayerTime = time;
                break;
            }
        }

        if (!nextPrayer) {
            nextPrayer = 'fajr';
            nextPrayerTime = new Date(prayerTimes.fajr);
            nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
        }

        return { name: nextPrayer, time: nextPrayerTime };
    }

    // Fonction pour mettre à jour le compte à rebours
    function updateCountdown(nextPrayerTime) {
        const now = new Date();
        const diff = nextPrayerTime - now;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Initialisation
    async function init() {
        const city = await getCurrentCity();
        document.getElementById('city-name').textContent = city;

        function updatePrayerInfo() {
            const nextPrayer = getNextPrayer();
            const prayerNames = {
                fajr: 'Fajr',
                dhuhr: 'Dhuhr',
                asr: 'Asr',
                maghrib: 'Maghrib',
                isha: 'Isha'
            };
            
            document.getElementById('next-prayer-name').textContent = 
                prayerNames[nextPrayer.name];
            
            document.getElementById('next-prayer-time').textContent = 
                nextPrayer.time.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            
            document.getElementById('prayer-countdown').textContent = 
                updateCountdown(nextPrayer.time);
        }

        updatePrayerInfo();
        setInterval(updatePrayerInfo, 1000);
    }

    init();
}); 