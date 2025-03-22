document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Charger le header avec un chemin absolu
        const headerResponse = await fetch('/views/components/header.html');
        const headerContent = await headerResponse.text();
        
        // Trouver le conteneur du header
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) {
            console.error('Conteneur de header non trouvé dans la page');
            return;
        }
        
        // Insérer le header dans son conteneur
        headerContainer.innerHTML = headerContent;
        
        // Initialiser le menu mobile
        const menuToggle = headerContainer.querySelector('.menu-toggle');
        const navLinks = headerContainer.querySelector('.nav-links');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', function() {
                menuToggle.classList.toggle('active');
                navLinks.classList.toggle('show');
            });

            // Fermer le menu quand on clique sur un lien
            const links = navLinks.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    navLinks.classList.remove('show');
                });
            });
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement du header:', error);
        console.error(error.stack);
    }
});