class QuranPlayer {
    constructor() {
        // Vérification de la configuration globale
        if (!window.APP_CONFIG) {
            console.error('Configuration globale non trouvée. Utilisation des valeurs par défaut.');
            this.apiBaseUrl = 'http://localhost:3000/api/quran';
        } else {
            this.apiBaseUrl = window.APP_CONFIG.API_BASE_URL + '/quran';
        }

        this.currentSurah = null;
        this.sound = null;
        this.isPlaying = false;
        this.reciters = {
            'mishary': 'Mishary Rashid Alafasy',
            'sudais': 'Abdur-Rahman As-Sudais',
            'ghamdi': 'Saad Al-Ghamdi',
            'ajamy': 'Ahmed Al-Ajamy',
            'maher': 'Maher Al Muaiqly',
            'husary': 'Mahmoud Khalil Al-Husary',
            'minshawi': 'Mohamed Siddiq El-Minshawi',
            'abdul_basit': 'Abdul Basit Abdul Samad'
        };
        this.reciterUrls = {
            'mishary': 'https://server8.mp3quran.net/afs',
            'sudais': 'https://server11.mp3quran.net/sds',
            'ghamdi': 'https://server7.mp3quran.net/s_gmd',
            'ajamy': 'https://server8.mp3quran.net/ahmad_huth',
            'maher': 'https://server12.mp3quran.net/maher',
            'husary': 'https://server7.mp3quran.net/husr',
            'minshawi': 'https://server9.mp3quran.net/minsh',
            'abdul_basit': 'https://server7.mp3quran.net/basit'
        };
        this.reciter = 'mishary';
        this.baseApiUrl = 'https://api.alquran.cloud/v1';
        this.currentAyah = 0;
        this.ayahs = [];
        this.favorites = JSON.parse(localStorage.getItem('quranFavorites')) || {};
        this.translations = {
            'fr': 'fr.hamidullah',
            'en': 'en.sahih'
        };
        this.currentTranslation = 'fr';
        this.autoPlay = false;
        this.repeatAyah = 0;
        this.listeningSession = {
            startTime: null,
            elapsedTime: 0
        };
        
        // Initialize UI elements
        this.init();
        this.togglePlay = this.togglePlay.bind(this);
    }

    async init() {
        // Initialize UI elements
        this.progressBar = document.getElementById('progress');
        this.timeDisplay = document.getElementById('time-display');
        this.playButton = document.getElementById('playButton');
        
        // Load surahs and setup event listeners
        await this.loadSurahs();
        this.setupEventListeners();
        this.populateReciterSelect();
        
        // Initialiser la progression
        this.updateProgressBar(0);
    }

    populateReciterSelect() {
        const reciterSelect = document.getElementById('reciter-select');
        if (!reciterSelect) return;

        // Vider le sélecteur
        reciterSelect.innerHTML = '<option value="">Sélectionner un récitateur</option>';

        // Ajouter les récitateurs
        Object.entries(this.reciters).forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            if (id === this.reciter) {
                option.selected = true;
            }
            reciterSelect.appendChild(option);
        });
    }

    async loadSurahs() {
        try {
            const response = await fetch(`${this.baseApiUrl}/surah`);
            const data = await response.json();
            if (data.code === 200) {
                this.renderSurahList(data.data);
            } else {
                throw new Error('Erreur lors du chargement des sourates');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des sourates:', error);
            const surahList = document.getElementById('surahList');
            if (surahList) {
                surahList.innerHTML = '<div class="error-message">Erreur de chargement des sourates</div>';
            }
        }
    }

    renderSurahList(surahs) {
        const surahList = document.getElementById('surahList');
        if (!surahList) return;
        
        surahList.innerHTML = surahs.map(surah => `
            <div class="surah-item" data-surah="${surah.number}">
                <span class="surah-number">${surah.number}.</span>
                <span class="surah-name">${surah.name}</span>
                <span class="surah-english">(${surah.englishName})</span>
            </div>
        `).join('');
    }

    setupEventListeners() {
        const surahList = document.getElementById('surahList');
        if (surahList) {
            surahList.addEventListener('click', (e) => {
                const surahItem = e.target.closest('.surah-item');
                if (surahItem) {
                    const surahNumber = parseInt(surahItem.dataset.surah);
                    this.loadSurah(surahNumber);
                }
            });
        }

        if (this.playButton) {
            this.playButton.addEventListener('click', this.togglePlay);
        }

        // Gestion du bouton stop
        const stopButton = document.getElementById('stop');
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                if (this.sound) {
                    this.sound.stop();
                    this.updateProgressBar(0);
                    if (this.timeDisplay) {
                        const duration = this.sound.duration() || 0;
                        this.timeDisplay.textContent = `00:00 / ${this.formatTime(duration)}`;
                    }
                }
            });
        }

        // Gestion du volume
        const volumeControl = document.getElementById('volume');
        if (volumeControl) {
            volumeControl.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value) / 100;
                if (this.sound) {
                    this.sound.volume(volume);
                }
                localStorage.setItem('quranPlayerVolume', volume);
            });

            // Restaurer le volume précédent
            const savedVolume = localStorage.getItem('quranPlayerVolume');
            if (savedVolume !== null) {
                const volume = parseFloat(savedVolume);
                volumeControl.value = volume * 100;
                if (this.sound) {
                    this.sound.volume(volume);
                }
            }
        }

        // Gestion du clic sur la barre de progression
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                if (!this.sound || !this.sound.duration()) return;

                const rect = progressContainer.getBoundingClientRect();
                const clickPosition = e.clientX - rect.left;
                const containerWidth = rect.width;
                const seekPercentage = (clickPosition / containerWidth);
                const seekTime = this.sound.duration() * seekPercentage;

                this.sound.seek(seekTime);
                this.updateProgressBar(seekPercentage * 100);
                
                if (this.timeDisplay) {
                    this.timeDisplay.textContent = `${this.formatTime(seekTime)} / ${this.formatTime(this.sound.duration())}`;
                }
            });
        }

        const reciterSelect = document.getElementById('reciter-select');
        if (reciterSelect) {
            reciterSelect.addEventListener('change', (e) => {
                this.changeReciter(e.target.value);
            });
        }

        const translationSelect = document.getElementById('translationSelect');
        if (translationSelect) {
            translationSelect.addEventListener('change', (e) => {
                this.currentTranslation = e.target.value;
                if (this.currentSurah) {
                    this.loadSurah(this.currentSurah);
                }
            });
        }

        const surahSearch = document.getElementById('surahSearch');
        if (surahSearch) {
            surahSearch.addEventListener('input', (e) => {
                this.filterSurahs(e.target.value);
            });
        }

        const autoPlayToggle = document.getElementById('autoPlayToggle');
        if (autoPlayToggle) {
            autoPlayToggle.addEventListener('change', (e) => {
                this.autoPlay = e.target.checked;
            });
        }

        this.progressBar = document.getElementById('progress');
        this.timeDisplay = document.getElementById('time-display');
        
        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => {
                if (!this.sound || !this.sound.duration()) return;

                const rect = this.progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const duration = this.sound.duration();
                const seekTime = duration * percent;

                console.log('Seeking to:', this.formatTime(seekTime));
                this.sound.seek(seekTime);
                this.updateProgressBar(seekTime / duration);
            });
        }
    }

    async loadSurah(number) {
        try {
            // Mise à jour du titre
            const currentSurahElement = document.getElementById('currentSurah');
            if (currentSurahElement) {
                currentSurahElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement de la sourate...';
            }

            // Charger le texte arabe
            const arabicResponse = await fetch(`${this.baseApiUrl}/surah/${number}/ar.alafasy`);
            const arabicData = await arabicResponse.json();
            
            // Charger la traduction
            const translationResponse = await fetch(
                `${this.baseApiUrl}/surah/${number}/${this.translations[this.currentTranslation]}`
            );
            const translationData = await translationResponse.json();
            
            if (arabicData.code === 200 && translationData.code === 200) {
                this.currentSurah = number;
                this.ayahs = arabicData.data.ayahs.map((ayah, index) => ({
                    ...ayah,
                    translation: translationData.data.ayahs[index].text,
                    isFavorite: this.favorites[`${number}_${ayah.numberInSurah}`] || false
                }));

                // Mettre à jour le titre avec le nom de la sourate
                if (currentSurahElement) {
                    currentSurahElement.textContent = `${arabicData.data.name} - ${arabicData.data.englishName}`;
                }

                this.renderAyahs();
                this.updateAudioSource();
                
                // Faire défiler vers le haut
                const quranContent = document.querySelector('.quran-content');
                if (quranContent) {
                    quranContent.scrollTop = 0;
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la sourate:', error);
            const currentSurahElement = document.getElementById('currentSurah');
            if (currentSurahElement) {
                currentSurahElement.textContent = 'Erreur de chargement';
            }
            const quranVerses = document.querySelector('.quran-verses');
            if (quranVerses) {
                quranVerses.innerHTML = '<div class="error-message">Erreur de chargement de la sourate</div>';
            }
        }
    }

    renderAyahs() {
        const container = document.querySelector('.quran-verses');
        if (!container) return;
        
        // Créer le conteneur pour le texte arabe
        const arabicContent = document.createElement('div');
        arabicContent.className = 'arabic-text';
        arabicContent.dir = 'rtl';
        
        // Afficher le texte arabe en continu
        this.ayahs.forEach((ayah, index) => {
            const verseSpan = document.createElement('span');
            verseSpan.className = `verse ${this.currentAyah === index ? 'active' : ''}`;
            verseSpan.setAttribute('data-index', index);
            
            // Texte du verset
            const textSpan = document.createElement('span');
            textSpan.className = 'verse-text';
            textSpan.textContent = ayah.text + ' ';
            
            // Numéro du verset
            const numberSpan = document.createElement('span');
            numberSpan.className = 'verse-number';
            numberSpan.textContent = ayah.numberInSurah;
            
            // Actions (favoris et répétition)
            const actionsSpan = document.createElement('span');
            actionsSpan.className = 'verse-actions';
            actionsSpan.innerHTML = `
                <button class="btn-favorite ${this.favorites[`${this.currentSurah}_${ayah.numberInSurah}`] ? 'active' : ''}"
                        onclick="quranPlayer.toggleFavorite(${this.currentSurah}, ${ayah.numberInSurah})">
                    <i class="fas fa-star"></i>
                </button>
                <button class="btn-repeat ${this.repeatAyah === index ? 'active' : ''}" 
                        onclick="quranPlayer.setRepeatAyah(${index})">
                    <i class="fas fa-redo"></i>
                </button>
            `;
            
            verseSpan.appendChild(textSpan);
            verseSpan.appendChild(numberSpan);
            verseSpan.appendChild(actionsSpan);
            arabicContent.appendChild(verseSpan);
        });
        
        // Créer le conteneur pour les traductions
        const translationContent = document.createElement('div');
        translationContent.className = 'translation-text';
        
        this.ayahs.forEach(ayah => {
            const translationPara = document.createElement('p');
            translationPara.textContent = `${ayah.numberInSurah}. ${ayah.translation}`;
            translationContent.appendChild(translationPara);
        });
        
        // Vider le conteneur et ajouter le nouveau contenu
        container.innerHTML = '';
        container.appendChild(arabicContent);
        container.appendChild(translationContent);
    }

    toggleFavorite(surahNumber, ayahNumber) {
        const key = `${surahNumber}_${ayahNumber}`;
        this.favorites[key] = !this.favorites[key];
        localStorage.setItem('quranFavorites', JSON.stringify(this.favorites));
        this.renderAyahs();
    }

    setRepeatAyah(index) {
        this.repeatAyah = this.repeatAyah === index ? 0 : index;
        const btnRepeatElements = document.querySelectorAll('.btn-repeat');
        btnRepeatElements.forEach(btn => btn.classList.toggle('active', false));
        const currentVerse = document.querySelector(`.verse[data-index="${index}"] .btn-repeat`);
        if (currentVerse) {
            currentVerse.classList.toggle('active', true);
        }
    }

    changeReciter(reciterId) {
        this.reciter = reciterId;
        this.updateAudioSource();
    }

    updateAudioSource() {
        if (this.sound) {
            this.sound.unload();
        }

        // Construire l'URL du fichier audio
        const audioUrl = `${this.reciterUrls[this.reciter]}/${String(this.currentSurah).padStart(3, '0')}.mp3`;
        console.log('Loading audio from:', audioUrl);

        // Créer un nouvel objet Howl
        this.sound = new Howl({
            src: [audioUrl],
            html5: true,
            preload: true,
            volume: parseFloat(localStorage.getItem('quranPlayerVolume') || '1.0'),
            onload: () => {
                console.log('Audio chargé avec succès');
                if (this.onload) this.onload();
            },
            onplay: () => {
                this.isPlaying = true;
                if (this.playButton) {
                    this.playButton.innerHTML = '<i class="fas fa-pause"></i>';
                }
                this.startProgressUpdate();
                this.startListeningSession();
                if (this.onplay) this.onplay();
            },
            onpause: () => {
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.innerHTML = '<i class="fas fa-play"></i>';
                }
                this.stopProgressUpdate();
                if (this.onpause) this.onpause();
            },
            onstop: () => {
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.innerHTML = '<i class="fas fa-play"></i>';
                }
                this.stopProgressUpdate();
                this.updateProgressBar(0);
                if (this.onstop) this.onstop();
            },
            onend: () => {
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.innerHTML = '<i class="fas fa-play"></i>';
                }
                this.stopProgressUpdate();
                this.updateProgressBar(0);
                
                if (this.autoPlay) {
                    this.playNextSurah();
                }
                
                if (this.onend) this.onend();
            },
            onloaderror: (id, error) => {
                console.error('Erreur de chargement audio:', error);
                if (this.onloaderror) this.onloaderror(id, error);
            }
        });
    }

    startProgressUpdate() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.progressInterval = setInterval(() => {
            if (this.sound && this.sound.playing()) {
                const seek = this.sound.seek() || 0;
                const duration = this.sound.duration() || 0;
                const progress = (seek / duration) * 100;
                
                // Mettre à jour la barre de progression
                this.updateProgressBar(progress);
                
                // Mettre à jour l'affichage du temps
                if (this.timeDisplay) {
                    this.timeDisplay.textContent = `${this.formatTime(seek)} / ${this.formatTime(duration)}`;
                }

                // Calculer l'ayah actuelle en fonction du temps écoulé
                const ayahDuration = duration / this.ayahs.length;
                const currentAyah = Math.floor(seek / ayahDuration);
                
                // Si l'ayah a changé, mettre à jour la surbrillance
                if (currentAyah !== this.currentAyah) {
                    this.currentAyah = currentAyah;
                    this.highlightCurrentAyah();
                }
            }
        }, 100); // Mise à jour toutes les 100ms
    }

    updateProgressBar(percent) {
        if (this.progressBar) {
            const progressElement = this.progressBar.querySelector('.progress');
            if (progressElement) {
                progressElement.style.width = `${percent}%`;
            }
        }
    }

    stopProgressUpdate() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    formatTime(seconds) {
        seconds = Math.floor(seconds);
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    togglePlay() {
        console.log('Toggle play clicked');
        if (!this.sound) {
            console.log('No sound loaded');
            return;
        }

        try {
            if (this.sound.playing()) {
                console.log('Pausing audio');
                this.sound.pause();
                this.isPlaying = false;
                if (this.playButton) {
                    this.playButton.innerHTML = '<i class="fas fa-play"></i>';
                }
                const duration = this.stopListeningSession();
            } else {
                console.log('Starting audio');
                this.sound.play();
                this.isPlaying = true;
                if (this.playButton) {
                    this.playButton.innerHTML = '<i class="fas fa-pause"></i>';
                }
                this.startListeningSession();
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    }

    highlightCurrentAyah() {
        const verseElements = document.querySelectorAll('.verse');
        verseElements.forEach(verse => {
            verse.classList.remove('active');
        });
        const currentVerse = document.querySelector(`.verse[data-index="${this.currentAyah}"]`);
        if (currentVerse) {
            currentVerse.classList.add('active');
            currentVerse.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }

    filterSurahs(searchTerm) {
        const items = document.querySelectorAll('.surah-item');
        searchTerm = searchTerm.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    playNextSurah() {
        const nextSurahNumber = this.currentSurah + 1;
        if (nextSurahNumber <= 114) {
            this.loadSurah(nextSurahNumber);
        }
    }

    updateProgress(progress) {
        // S'assurer que progress a une structure valide
        progress = progress || {};
        progress.completedSurahs = progress.completedSurahs || [];
        progress.totalListeningTime = progress.totalListeningTime || '00:00:00';
        progress.hasCompletedSurahs = progress.hasCompletedSurahs || false;

        // Mettre à jour l'affichage des statistiques
        const totalTimeElement = document.getElementById('total-listening-time');
        const completedSurahsElement = document.getElementById('completed-surahs');

        if (totalTimeElement) {
            totalTimeElement.textContent = progress.totalListeningTime;
        }
        if (completedSurahsElement) {
            completedSurahsElement.textContent = progress.completedSurahs.length;
        }

        // Mettre à jour la progression visuelle des sourates
        const surahElements = document.querySelectorAll('[data-surah-id]');
        surahElements.forEach(element => {
            const surahId = parseInt(element.dataset.surahId);
            if (progress.completedSurahs.includes(surahId)) {
                element.classList.add('completed');
            } else {
                element.classList.remove('completed');
            }
        });

        // Mettre à jour les badges si l'utilisateur a complété au moins une sourate
        if (progress.hasCompletedSurahs) {
            document.body.classList.add('has-completed-surahs');
        } else {
            document.body.classList.remove('has-completed-surahs');
        }
    }

    loadUserProgress() {
        // Charger les progrès de l'utilisateur depuis le localStorage
        const progress = JSON.parse(localStorage.getItem('quranProgress')) || {
            completedSurahs: [],
            listeningTime: 0,
            favoriteVerses: []
        };
        
        this.updateProgress(progress);
    }

    updateStatsDisplay(stats) {
        // Mettre à jour l'affichage des statistiques
        const totalTimeElement = document.getElementById('total-listening-time');
        const uniqueSurahsElement = document.getElementById('unique-surahs');
        const completedSurahsElement = document.getElementById('completed-surahs');

        if (totalTimeElement) {
            totalTimeElement.textContent = stats.total_listening_time || '00:00:00';
        }
        if (uniqueSurahsElement) {
            uniqueSurahsElement.textContent = stats.total_unique_surahs || 0;
        }
        if (completedSurahsElement) {
            completedSurahsElement.textContent = stats.completed_surahs || 0;
        }

        // Mettre à jour la progression visuelle des sourates
        if (stats.completed_surah_ids) {
            stats.completed_surah_ids.forEach(surahId => {
                const surahElement = document.querySelector(`[data-surah-id="${surahId}"]`);
                if (surahElement) {
                    surahElement.classList.add('completed');
                }
            });
        }
    }

    markSurahAsCompleted(surahNumber) {
        const progress = JSON.parse(localStorage.getItem('quranProgress')) || {
            completedSurahs: [],
            listeningTime: 0,
            favoriteVerses: []
        };

        if (!progress.completedSurahs.includes(surahNumber)) {
            progress.completedSurahs.push(surahNumber);
            localStorage.setItem('quranProgress', JSON.stringify(progress));
            this.updateProgress(progress);
        }
    }

    updateListeningTime(duration) {
        const progress = JSON.parse(localStorage.getItem('quranProgress')) || {
            completedSurahs: [],
            listeningTime: 0,
            favoriteVerses: []
        };

        progress.listeningTime += duration;
        localStorage.setItem('quranProgress', JSON.stringify(progress));
        this.updateProgress(progress);
    }

    toggleFavoriteVerse(surahNumber, verseNumber) {
        const progress = JSON.parse(localStorage.getItem('quranProgress')) || {
            completedSurahs: [],
            listeningTime: 0,
            favoriteVerses: []
        };

        const verseId = `${surahNumber}:${verseNumber}`;
        const index = progress.favoriteVerses.indexOf(verseId);

        if (index === -1) {
            progress.favoriteVerses.push(verseId);
        } else {
            progress.favoriteVerses.splice(index, 1);
        }

        localStorage.setItem('quranProgress', JSON.stringify(progress));
        this.updateProgress(progress);
    }

    formatListeningTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    startListeningSession() {
        this.listeningSession.startTime = Date.now();
    }

    stopListeningSession() {
        if (this.listeningSession.startTime) {
            const currentTime = Date.now();
            const sessionDuration = (currentTime - this.listeningSession.startTime) / 1000; // en secondes
            this.listeningSession.elapsedTime += sessionDuration;
            this.listeningSession.startTime = null;
            return this.listeningSession.elapsedTime;
        }
        return 0;
    }

    resetListeningSession() {
        this.listeningSession.startTime = null;
        this.listeningSession.elapsedTime = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuranPlayer();
});