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
        
        // Initialiser l'interface et les événements après l'insertion
        setTimeout(() => {
            updateAuthUI();
            setupModalEvents();
            
            // Ajouter les écouteurs d'événements pour les boutons
            const loginButton = document.querySelector('.btn-login');
            const logoutButton = document.querySelector('.btn-logout');
            
            if (loginButton) {
                loginButton.addEventListener('click', openLoginModal);
            }
            
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }
        }, 0);
    } catch (error) {
        console.error('Erreur lors du chargement du header:', error);
        console.error(error.stack);
    }
});

function updateAuthUI() {
    try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const userType = localStorage.getItem('userType');
        const userSection = document.getElementById('user-section');
        const guestSection = document.getElementById('guest-section');
        const userNameSpan = document.getElementById('user-name');
        const adminLink = document.getElementById('admin-link');

        if (!userSection || !guestSection || !userNameSpan) {
            console.error('Éléments d\'authentification non trouvés');
            return;
        }

        if (token && username) {
            userSection.style.display = 'flex';
            guestSection.style.display = 'none';
            userNameSpan.textContent = username;
            
            // Afficher/masquer le lien d'administration selon le type d'utilisateur
            if (adminLink) {
                adminLink.style.display = userType === 'admin' ? 'block' : 'none';
            }
        } else {
            userSection.style.display = 'none';
            guestSection.style.display = 'flex';
            if (adminLink) {
                adminLink.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erreur dans updateAuthUI:', error);
    }
}

function setupModalEvents() {
    try {
        const modal = document.getElementById('login-modal');
        const closeButton = document.querySelector('.close-modal');
        const loginForm = document.getElementById('login-form');

        if (!modal || !closeButton || !loginForm) {
            console.error('Éléments de la modal non trouvés');
            return;
        }

        // Fermer la modal en cliquant en dehors
        window.onclick = function(event) {
            if (event.target === modal) {
                closeLoginModal();
            }
        };

        // Fermer la modal avec le bouton X
        closeButton.addEventListener('click', closeLoginModal);

        // Gérer la touche Echap
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                closeLoginModal();
            }
        });

        // Gérer la soumission du formulaire
        loginForm.addEventListener('submit', handleLogin);
    } catch (error) {
        console.error('Erreur dans setupModalEvents:', error);
    }
}

function openLoginModal() {
    try {
        const modal = document.getElementById('login-modal');
        if (!modal) {
            console.error('Modal de connexion non trouvée');
            return;
        }
        modal.style.display = 'block';
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
        }
    } catch (error) {
        console.error('Erreur dans openLoginModal:', error);
    }
}

function closeLoginModal() {
    try {
        const modal = document.getElementById('login-modal');
        const errorDiv = document.getElementById('login-error');
        const loginForm = document.getElementById('login-form');

        if (modal) {
            modal.style.display = 'none';
        }

        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        if (loginForm) {
            loginForm.reset();
        }
    } catch (error) {
        console.error('Erreur dans closeLoginModal:', error);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        const errorDiv = document.getElementById('login-error');
        
        if (!email || !password) {
            if (errorDiv) {
                errorDiv.textContent = 'Veuillez remplir tous les champs';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        console.log('Tentative de connexion avec:', { email });
        
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Réponse du serveur:', data);

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', `${data.user.us_fname} ${data.user.us_lname}`);
            localStorage.setItem('userType', data.user.us_type);
            closeLoginModal();
            updateAuthUI();
            window.location.reload();
        } else {
            if (errorDiv) {
                errorDiv.textContent = data.message || data.error || 'Erreur de connexion';
                errorDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Erreur dans handleLogin:', error);
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = 'Erreur de connexion au serveur';
            errorDiv.style.display = 'block';
        }
    }
}

function logout() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userType');
        updateAuthUI();
        window.location.href = '/';  // Redirection vers la racine du site
    } catch (error) {
        console.error('Erreur dans logout:', error);
    }
}
