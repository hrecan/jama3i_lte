// Fichier vide pour le moment ou ajoutez votre code spécifique à la page d'accueil 

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser AOS seulement s'il est disponible
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });

        // Ajouter les animations AOS aux éléments (sans les heures de prière)
        addAOSAnimations();
    }

    // Initialiser les autres fonctionnalités de la page
    initializePageFeatures();
});

function addAOSAnimations() {
    // Animations pour les mosquées
    document.querySelectorAll('.mosque-item').forEach((el, index) => {
        el.setAttribute('data-aos', 'fade-left');
        el.setAttribute('data-aos-delay', (index * 100).toString());
    });

    // Animations pour les événements
    document.querySelectorAll('.event-card').forEach((el, index) => {
        el.setAttribute('data-aos', 'zoom-in');
        el.setAttribute('data-aos-delay', (index * 100).toString());
    });
}

function initializePageFeatures() {
    // Gérer le menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.querySelector('i').classList.toggle('fa-bars');
            menuToggle.querySelector('i').classList.toggle('fa-times');
        });

        // Fermer le menu quand on clique sur un lien
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').classList.add('fa-bars');
                menuToggle.querySelector('i').classList.remove('fa-times');
            });
        });

        // Fermer le menu quand on clique en dehors
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').classList.add('fa-bars');
                menuToggle.querySelector('i').classList.remove('fa-times');
            }
        });
    }
}