class ErrorHandler {
    static errorMessages = {
        'INVALID_EMAIL': 'Format d\'email invalide',
        'INVALID_PASSWORD': 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
        'USER_NOT_FOUND': 'Utilisateur non trouvé',
        'WRONG_PASSWORD': 'Mot de passe incorrect',
        'EMAIL_EXISTS': 'Cet email est déjà utilisé',
        'NETWORK_ERROR': 'Erreur de connexion au serveur',
        'SERVER_ERROR': 'Erreur serveur, veuillez réessayer plus tard',
        'DEFAULT': 'Une erreur est survenue'
    };

    static showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = this.errorMessages[message] || message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    static handleApiError(error) {
        console.error('API Error:', error);
        
        if (!navigator.onLine) {
            this.showToast('NETWORK_ERROR');
            return;
        }

        if (error.response) {
            const status = error.response.status;
            switch (status) {
                case 400:
                    this.showToast(error.response.data.code || 'DEFAULT');
                    break;
                case 401:
                    this.showToast('USER_NOT_FOUND');
                    break;
                case 403:
                    this.showToast('WRONG_PASSWORD');
                    break;
                case 409:
                    this.showToast('EMAIL_EXISTS');
                    break;
                default:
                    this.showToast('SERVER_ERROR');
            }
        } else {
            this.showToast('NETWORK_ERROR');
        }
    }
} 