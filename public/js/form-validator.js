class FormValidator {
    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validatePassword(password) {
        // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return regex.test(password);
    }

    static validateName(name) {
        return name.length >= 3 && /^[a-zA-ZÀ-ÿ\s]{3,}$/.test(name);
    }

    static showError(input, message) {
        const formGroup = input.parentElement;
        const error = formGroup.querySelector('.error-message') || 
                      document.createElement('div');
        
        error.className = 'error-message';
        error.textContent = message;
        
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(error);
        }
        
        input.classList.add('error');
    }

    static clearError(input) {
        const formGroup = input.parentElement;
        const error = formGroup.querySelector('.error-message');
        
        if (error) {
            formGroup.removeChild(error);
        }
        
        input.classList.remove('error');
    }
} 