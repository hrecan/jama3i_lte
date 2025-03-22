// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le quiz avec la langue par défaut
    initQuiz('fr');

    // Ajouter l'écouteur d'événement pour le changement de langue
    document.getElementById('language').addEventListener('change', (e) => {
        initQuiz(e.target.value);
        // Mettre à jour la direction du texte
        document.body.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
        // Mettre à jour les niveaux de difficulté
        updateDifficultyOptions(e.target.value);
    });
});

function updateDifficultyOptions(language) {
    const difficultySelect = document.getElementById('difficulty');
    const difficulties = {
        'fr': ['Facile', 'Moyen', 'Difficile', 'Expert'],
        'ar': ['سهل', 'متوسط', 'صعب', 'خبير'],
        'en': ['Easy', 'Medium', 'Hard', 'Expert']
    };
    
    difficultySelect.innerHTML = '';
    difficulties[language].forEach(diff => {
        const option = document.createElement('option');
        option.value = diff;
        option.textContent = diff;
        difficultySelect.appendChild(option);
    });
}

async function initQuiz(language) {
    try {
        // Charger les questions dans la langue sélectionnée
        const jsonPath = language === 'fr' ? '/data/quiz-questions.json' : `/data/translations/quiz-questions-${language}.json`;
        console.log('Chargement du fichier:', jsonPath);
        
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Questions chargées:', data.questions.length);
        
        if (!data.questions || data.questions.length === 0) {
            throw new Error('Aucune question trouvée dans le fichier JSON');
        }

        // Adapter les niveaux de difficulté selon la langue
        const questions = data.questions.map(q => ({
            ...q,
            difficulty: translateDifficulty(q.difficulty, language)
        }));

        // Initialiser ou mettre à jour le quiz
        if (window.quizInstance) {
            window.quizInstance.updateQuestions(questions, language);
        } else {
            window.quizInstance = new Quiz(questions, language);
        }

        // Masquer le message d'erreur s'il existe
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = '';
        }

        // Mettre à jour les options de difficulté
        updateDifficultyOptions(language);
    } catch (error) {
        console.error('Erreur lors du chargement des questions:', error);
        document.getElementById('error-message').textContent = `Erreur lors du chargement des questions: ${error.message}`;
    }
}

function translateDifficulty(difficulty, language) {
    const difficultyMap = {
        'fr': {
            'Easy': 'Facile',
            'Medium': 'Moyen',
            'Hard': 'Difficile',
            'Expert': 'Expert',
            'سهل': 'Facile',
            'متوسط': 'Moyen',
            'صعب': 'Difficile',
            'خبير': 'Expert'
        },
        'ar': {
            'Facile': 'سهل',
            'Moyen': 'متوسط',
            'Difficile': 'صعب',
            'Expert': 'خبير',
            'Easy': 'سهل',
            'Medium': 'متوسط',
            'Hard': 'صعب'
        },
        'en': {
            'Facile': 'Easy',
            'Moyen': 'Medium',
            'Difficile': 'Hard',
            'Expert': 'Expert',
            'سهل': 'Easy',
            'متوسط': 'Medium',
            'صعب': 'Hard'
        }
    };

    return difficultyMap[language]?.[difficulty] || difficulty;
}

class Quiz {
    constructor(questions, language) {
        this.allQuestions = questions;
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedQuestions = [];
        this.difficultyLevels = ['Facile', 'Moyen', 'Difficile', 'Expert'];
        this.minScoreForNextLevel = 7;
        this.currentLanguage = language;
        
        // Interface translations
        this.translations = {
            fr: {
                startTitle: "Prêt pour le quiz ?",
                startDesc: "10 questions aléatoires sur l'Islam",
                questionNumber: "Question",
                retry: "Recommencer ce niveau",
                nextLevel: "Niveau suivant",
                score: "Votre score :",
                congrats: "Félicitations ! Vous pouvez passer au niveau suivant.",
                mastered: "Félicitations ! Vous avez maîtrisé tous les niveaux !",
                needMore: "Vous avez besoin d'au moins {score} bonnes réponses pour passer au niveau suivant.",
                notEnoughQuestions: "Pas assez de questions disponibles pour cette difficulté. Toutes les questions seront utilisées."
            },
            ar: {
                startTitle: "هل أنت مستعد للاختبار؟",
                startDesc: "10 أسئلة عشوائية عن الإسلام",
                questionNumber: "السؤال",
                retry: "إعادة هذا المستوى",
                nextLevel: "المستوى التالي",
                score: "نتيجتك:",
                congrats: "تهانينا! يمكنك الانتقال إلى المستوى التالي.",
                mastered: "تهانينا! لقد أتقنت جميع المستويات!",
                needMore: "تحتاج إلى {score} إجابات صحيحة على الأقل للانتقال إلى المستوى التالي.",
                notEnoughQuestions: "لا توجد أسئلة كافية لهذا المستوى. سيتم استخدام جميع الأسئلة المتوفرة."
            },
            en: {
                startTitle: "Ready for the quiz?",
                startDesc: "10 random questions about Islam",
                questionNumber: "Question",
                retry: "Retry this level",
                nextLevel: "Next level",
                score: "Your score:",
                congrats: "Congratulations! You can move to the next level.",
                mastered: "Congratulations! You have mastered all levels!",
                needMore: "You need at least {score} correct answers to move to the next level.",
                notEnoughQuestions: "Not enough questions available for this difficulty. All available questions will be used."
            }
        };
        
        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.questionText = document.getElementById('question-text');
        this.answersContainer = document.getElementById('answers');
        this.questionNumber = document.getElementById('question-number');
        this.progressFill = document.getElementById('progress-fill');
        this.finalScore = document.getElementById('final-score');
        this.scoreMessage = document.getElementById('score-message');
        this.difficultySelect = document.getElementById('difficulty');
        this.currentDifficultyBadge = document.getElementById('current-difficulty');
        this.nextLevelBtn = document.getElementById('next-level-btn');
        
        // Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startQuiz());
        document.getElementById('retry-btn').addEventListener('click', () => this.startQuiz());
        this.nextLevelBtn.addEventListener('click', () => this.startNextLevel());

        // Initialize
        this.difficultySelect.value = 'Facile';
        this.updateUILanguage();
    }

    updateQuestions(questions, language) {
        this.allQuestions = questions;
        this.currentLanguage = language;
        this.updateUILanguage();
        this.startQuiz();
    }

    updateUILanguage() {
        const t = this.translations[this.currentLanguage];
        
        // Update static UI elements
        document.querySelector('#start-screen h2').textContent = t.startTitle;
        document.querySelector('#start-screen p').textContent = t.startDesc;
        document.getElementById('retry-btn').textContent = t.retry;
        this.nextLevelBtn.textContent = t.nextLevel;
        
        // Update dynamic elements if in quiz
        if (this.currentQuestionIndex < this.selectedQuestions.length) {
            this.questionNumber.textContent = `${t.questionNumber} ${this.currentQuestionIndex + 1}/${this.selectedQuestions.length}`;
        }
    }

    startQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        
        const selectedDifficulty = this.difficultySelect.value;
        this.questions = this.allQuestions.filter(q => q.difficulty === selectedDifficulty);

        if (this.questions.length < 10) {
            alert(this.translations[this.currentLanguage].notEnoughQuestions);
            this.selectedQuestions = this.questions;
        } else {
            this.selectedQuestions = this.getRandomQuestions(10);
        }
        
        this.showScreen('quiz');
        if (this.selectedQuestions.length > 0) {
            this.displayQuestion();
        }
    }

    startNextLevel() {
        const currentDifficultyIndex = this.difficultyLevels.indexOf(this.difficultySelect.value);
        if (currentDifficultyIndex < this.difficultyLevels.length - 1) {
            this.difficultySelect.value = this.difficultyLevels[currentDifficultyIndex + 1];
            this.startQuiz();
        }
    }

    getRandomQuestions(count) {
        const shuffled = [...this.questions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    displayQuestion() {
        if (!this.selectedQuestions || this.selectedQuestions.length === 0) {
            console.error('Aucune question disponible');
            return;
        }

        const question = this.selectedQuestions[this.currentQuestionIndex];
        if (!question) {
            console.error('Question non trouvée');
            return;
        }

        this.questionText.textContent = question.question;
        const t = this.translations[this.currentLanguage];
        this.questionNumber.textContent = `${t.questionNumber} ${this.currentQuestionIndex + 1}/${this.selectedQuestions.length}`;
        this.progressFill.style.width = `${((this.currentQuestionIndex + 1) / this.selectedQuestions.length) * 100}%`;
        
        this.currentDifficultyBadge.textContent = question.difficulty;
        this.currentDifficultyBadge.className = `difficulty-badge ${question.difficulty.toLowerCase()}`;
        
        this.answersContainer.innerHTML = '';
        if (question.answers && Array.isArray(question.answers)) {
            question.answers.forEach((answer, index) => {
                const button = document.createElement('button');
                button.className = 'answer-btn';
                button.textContent = answer;
                button.addEventListener('click', () => this.checkAnswer(index));
                this.answersContainer.appendChild(button);
            });
        }
    }

    checkAnswer(selectedIndex) {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        const buttons = this.answersContainer.querySelectorAll('.answer-btn');
        
        buttons.forEach(button => button.disabled = true);
        
        if (selectedIndex === question.correct) {
            buttons[selectedIndex].classList.add('correct');
            this.score++;
        } else {
            buttons[selectedIndex].classList.add('incorrect');
            buttons[question.correct].classList.add('correct');
        }

        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.selectedQuestions.length) {
                this.displayQuestion();
            } else {
                this.showResults();
            }
        }, 1500);
    }

    showResults() {
        const t = this.translations[this.currentLanguage];
        const totalQuestions = this.selectedQuestions.length;
        this.finalScore.textContent = `${this.score}/${totalQuestions}`;
        
        const currentDifficultyIndex = this.difficultyLevels.indexOf(this.difficultySelect.value);
        const isLastLevel = currentDifficultyIndex === this.difficultyLevels.length - 1;
        const canAdvance = this.score >= this.minScoreForNextLevel;

        if (canAdvance && !isLastLevel) {
            this.scoreMessage.textContent = t.congrats;
            this.scoreMessage.className = "success-message";
            this.nextLevelBtn.disabled = false;
        } else if (isLastLevel && canAdvance) {
            this.scoreMessage.textContent = t.mastered;
            this.scoreMessage.className = "success-message";
            this.nextLevelBtn.disabled = true;
        } else {
            this.scoreMessage.textContent = t.needMore.replace('{score}', this.minScoreForNextLevel);
            this.scoreMessage.className = "warning-message";
            this.nextLevelBtn.disabled = true;
        }

        this.showScreen('result');
    }

    showScreen(screenName) {
        this.startScreen.classList.add('hidden');
        this.quizScreen.classList.add('hidden');
        this.resultScreen.classList.add('hidden');

        switch(screenName) {
            case 'start':
                this.startScreen.classList.remove('hidden');
                break;
            case 'quiz':
                this.quizScreen.classList.remove('hidden');
                break;
            case 'result':
                this.resultScreen.classList.remove('hidden');
                break;
        }
    }
}
