document.addEventListener('DOMContentLoaded', function() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    if (!footerPlaceholder) {
        console.error('Élément footer-placeholder non trouvé');
        return;
    }

    // Charger le footer
    fetch('/views/components/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            footerPlaceholder.innerHTML = data;
            
            // Mettre à jour l'année dans le copyright
            const currentYear = new Date().getFullYear();
            const yearElement = document.getElementById('current-year');
            if (yearElement) {
                yearElement.textContent = currentYear;
            }
        })
        .catch(error => console.error('Erreur lors du chargement du footer:', error));
});
