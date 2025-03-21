document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userSection = document.getElementById('user-section');
    const guestSection = document.getElementById('guest-section');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Fonction pour décoder le token JWT
    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    // Fonction pour vérifier si l'utilisateur est admin
    function isAdmin(userData) {
        return userData && userData.role === 'admin';
    }

    // Fonction pour mettre à jour la navigation
    function updateNavigation() {
        const userData = token ? parseJwt(token) : null;
        const isUserAdmin = isAdmin(userData);

        // Mettre à jour les liens de navigation
        if (navLinks) {
            let adminLinks = [];

            if (isUserAdmin) {
                adminLinks = [
                    { href: '/views/quran.html', text: 'Quran' },
                    { href: '/views/courses.html', text: 'Cours' },
                    { href: '/views/database-admin.html', text: 'Gestion BDD' },
                ];
            }

            // Ajouter les liens admin si nécessaire
            if (isUserAdmin && !navLinks.querySelector('[href="/views/database-admin.html"]')) {
                adminLinks.forEach(link => {
                    const a = document.createElement('a');
                    a.href = link.href;
                    a.textContent = link.text;
                    a.setAttribute('data-admin-only', 'true');
                    navLinks.appendChild(a);
                });
            }
        }

        // Mettre à jour la section utilisateur/invité
        if (token && userData) {
            if (userSection) {
                userSection.style.display = 'flex';
                const userNameSpan = document.getElementById('user-name');
                if (userNameSpan) {
                    userNameSpan.textContent = userData.username || '';
                }
            }
            if (guestSection) {
                guestSection.style.display = 'none';
            }
        } else {
            if (userSection) {
                userSection.style.display = 'none';
            }
            if (guestSection) {
                guestSection.style.display = 'flex';
            }
        }
    }

    // Vérifier l'accès à la page actuelle
    function checkPageAccess() {
        const currentPath = window.location.pathname;
        const restrictedPages = [
            '/views/database-admin.html'
        ];
        
        if (restrictedPages.includes(currentPath)) {
            const userData = token ? parseJwt(token) : null;
            if (!isAdmin(userData)) {
                window.location.href = '/';
                return false;
            }
        }
        return true;
    }

    // Gérer la déconnexion
    window.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    // Gestion du menu mobile
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Fermer le menu quand on clique sur un lien
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Fermer le menu quand on clique en dehors
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // Initialiser la navigation
    if (checkPageAccess()) {
        updateNavigation();
    }
});
