class QuranPlayer {
    constructor() {
        // Configuration de base
        if (!window.APP_CONFIG) {
            console.error('Configuration globale non trouvée. Utilisation des valeurs par défaut.');
            this.apiBaseUrl = 'http://localhost:3000/api/quran';
        } else {
            this.apiBaseUrl = window.APP_CONFIG.API_BASE_URL + '/quran';
        }

        this.baseApiUrl = 'https://api.alquran.cloud/v1';
        this.reciterUrls = {
            'ar.alafasy': 'https://everyayah.com/data/Alafasy_128kbps'
        };
        this.reciter = 'ar.alafasy';
        this.sounds = []; // Array pour stocker tous les fichiers audio
        this.currentAyah = 0;
        this.totalAyahs = 0;
        this.isPlaying = false;
        this.currentSurah = null;
        this.progressInterval = null;
        this.volume = parseInt(localStorage.getItem('quranPlayerVolume')) || 100;
        this.fontSize = parseInt(localStorage.getItem('quranFontSize')) || 24;
        this.currentSeek = 0; // Ajout pour stocker la position actuelle
        
        this.listeningSession = {
            startTime: null,
            elapsedTime: 0
        };
        
        // Initialize UI elements
        this.init();
        this.loadFontSize();
        this.updateFontSize();
        this.initializeFontSizeControl();
        this.setupEventListeners();
    }

    async init() {
        await this.loadSurahs();
        this.setupSearch();
        this.setupReciterSelect();
        this.setupTranslationSelect();
    }

    setupEventListeners() {
        const sidebar = document.querySelector('.quran-sidebar');
        const container = document.querySelector('.quran-container');
        const playButton = document.getElementById('playButton');
        const stopButton = document.getElementById('stop');
        const volumeControl = document.getElementById('volume');

        if (playButton) {
            playButton.addEventListener('click', () => {
                if (!this.isPlaying) {
                    this.playCurrentVerse();
                    sidebar.classList.add('hidden');
                    container.classList.add('sidebar-hidden');
                } else {
                    this.pause();
                }
            });
        }

        if (stopButton) {
            stopButton.addEventListener('click', () => {
                this.stop();
                sidebar.classList.remove('hidden');
                container.classList.remove('sidebar-hidden');
            });
        }

        if (volumeControl) {
            volumeControl.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }

        // Modal settings
        const settingsButton = document.getElementById('settingsButton');
        const settingsModal = document.getElementById('settingsModal');
        const closeModal = document.querySelector('.close-modal');

        if (settingsButton && settingsModal) {
            settingsButton.addEventListener('click', () => {
                settingsModal.classList.add('active');
            });
        }

        if (closeModal && settingsModal) {
            closeModal.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });

            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('active');
                }
            });
        }

        // Gestion du clic sur la barre de progression
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                if (!this.sound) return;
                
                const rect = progressContainer.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const duration = this.sound.duration();
                
                if (duration) {
                    const seekTime = duration * percent;
                    this.sound.seek(seekTime);
                    this.updateProgress();
                }
            });
        }

        // Gestion du volume
        const volumeControl2 = document.getElementById('volume');
        if (volumeControl2) {
            volumeControl2.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }
    }

    play() {
        if (this.sounds.length > 0) {
            this.isPlaying = true;
            this.playCurrentAyah();
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-pause"></i>';
            }
            this.startProgressUpdate();
            this.startListeningSession();
        }
    }

    pause() {
        if (this.sounds.length > 0 && this.currentAyah < this.sounds.length) {
            this.sounds[this.currentAyah].pause();
            this.stopProgressUpdate();
            this.isPlaying = false;
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            }
            this.stopListeningSession();
        }
    }

    stop() {
        this.sounds.forEach(sound => {
            if (sound.playing()) {
                sound.stop();
            }
        });
        this.currentAyah = 0;
        this.stopProgressUpdate();
        this.isPlaying = false;
        this.updateProgressBar(0);
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.innerHTML = '<i class="fas fa-play"></i>';
        }
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            timeDisplay.textContent = '00:00 / --:--';
        }
        this.stopListeningSession();
    }

    startProgressUpdate() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.progressInterval = setInterval(() => {
            if (this.sounds.length > 0 && this.currentAyah < this.sounds.length) {
                const currentSound = this.sounds[this.currentAyah];
                if (currentSound && currentSound.playing()) {
                    this.updateProgress();
                }
            }
        }, 100);
    }

    stopProgressUpdate() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    updateProgress() {
        if (this.sounds.length > 0 && this.currentAyah < this.sounds.length) {
            const currentSound = this.sounds[this.currentAyah];
            if (currentSound && currentSound.playing()) {
                const seek = currentSound.seek() || 0;
                const duration = currentSound.duration() || 0;
                const percent = ((this.currentAyah + (seek / duration)) / this.totalAyahs) * 100;
                this.updateProgressBar(percent);

                const timeDisplay = document.getElementById('time-display');
                if (timeDisplay) {
                    const totalDuration = this.getTotalDuration();
                    const currentTime = this.getCurrentTotalTime();
                    timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(totalDuration)}`;
                }
            }
        }
    }

    updateProgressBar(percent) {
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressBar && progressFill) {
            // S'assurer que le pourcentage est entre 0 et 100
            percent = Math.max(0, Math.min(100, percent));
            progressFill.style.width = `${percent}%`;
            console.log('Progress updated:', percent + '%');
        }
    }

    playCurrentVerse() {
        if (this.currentSurah && !this.isPlaying && this.sounds.length > 0) {
            this.play();
        }
    }

    async loadSurahs() {
        try {
            const response = await fetch(`${this.baseApiUrl}/surah`);
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            
            // Vérifier le contenu de la réponse
            const text = await response.text();
            console.log('Response text:', text.substring(0, 200)); // Log les 200 premiers caractères
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('Erreur de parsing JSON, utilisation des données statiques');
                // Données statiques de secours
                data = {
                    code: 200,
                    status: "OK",
                    data: [
                        {
                            number: 1,
                            name: "الفاتحة",
                            englishName: "Al-Fatiha",
                            numberOfAyahs: 7
                        },
                        {
                            number: 2,
                            name: "البقرة",
                            englishName: "Al-Baqara",
                            numberOfAyahs: 286
                        },
                        {
                            number: 3,
                            name: "آل عمران",
                            englishName: "Ali 'Imran",
                            numberOfAyahs: 200
                        }
                        // Ajout de quelques sourates de plus pour le test
                    ]
                };
            }

            const surahList = document.getElementById('surahList');
            if (!surahList) {
                console.error('Element surahList non trouvé');
                return;
            }

            if (!data || !data.data) {
                console.error('Format de données invalide:', data);
                throw new Error('Format de données invalide');
            }

            surahList.innerHTML = data.data.map(surah => `
                <div class="surah-item" data-surah="${surah.number}">
                    <span class="surah-number">${surah.number}.</span>
                    <span class="surah-name">${surah.englishName}</span>
                    <span class="surah-arabic">${surah.name}</span>
                </div>
            `).join('');

            // Ajouter les écouteurs d'événements pour les sourates
            const surahItems = document.querySelectorAll('.surah-item');
            surahItems.forEach(item => {
                item.addEventListener('click', () => {
                    const surahNumber = parseInt(item.dataset.surah);
                    this.loadSurah(surahNumber);
                });
            });
        } catch (error) {
            console.error('Erreur lors du chargement des sourates:', error);
            // Afficher un message d'erreur dans l'interface
            const surahList = document.getElementById('surahList');
            if (surahList) {
                surahList.innerHTML = `
                    <div class="error-message">
                        <p>Erreur lors du chargement des sourates</p>
                        <p>Détail: ${error.message}</p>
                    </div>
                `;
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

    setupSearch() {
        const surahSearch = document.getElementById('surahSearch');
        if (surahSearch) {
            surahSearch.addEventListener('input', (e) => {
                this.filterSurahs(e.target.value);
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

    setupReciterSelect() {
        const reciterSelect = document.getElementById('reciter-select');
        if (reciterSelect) {
            reciterSelect.addEventListener('change', (e) => {
                this.changeReciter(e.target.value);
            });
        }
    }

    setupTranslationSelect() {
        const translationSelect = document.getElementById('translationSelect');
        if (translationSelect) {
            translationSelect.addEventListener('change', (e) => {
                this.currentTranslation = e.target.value;
                if (this.currentSurah) {
                    this.loadSurah(this.currentSurah);
                }
            });
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
        const audioUrl = `${this.reciterUrls[this.reciter]}/${String(this.currentSurah).padStart(3, '0')}001.mp3`;
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
            },
            onseek: () => {
                console.log('Audio seeked to:', this.sound.seek());
                this.currentSeek = this.sound.seek();
                if (this.sound.playing()) {
                    this.updateProgress();
                }
            }
        });
    }

    async loadSurah(number) {
        try {
            console.log('Loading surah:', number);
            const response = await fetch(`${this.baseApiUrl}/surah/${number}`);
            const data = await response.json();

            if (!data || !data.data) {
                console.error('Invalid surah data received');
                return;
            }

            this.currentSurah = data.data;
            
            // Mise à jour du titre
            const currentSurahElement = document.getElementById('currentSurah');
            if (currentSurahElement) {
                currentSurahElement.textContent = `${data.data.number}. ${data.data.name} - ${data.data.englishName}`;
            }

            // Affichage des versets
            const quranVerses = document.querySelector('.quran-verses');
            if (!quranVerses) {
                console.error('Container de versets non trouvé');
                return;
            }

            quranVerses.innerHTML = data.data.ayahs.map((ayah) => `
                <span class="verse" data-verse="${ayah.numberInSurah}">
                    <span class="verse-text">
                        <span class="arabic-text" lang="ar">${ayah.text}</span>
                        <span class="verse-number">${ayah.numberInSurah}</span>
                    </span>
                </span>
            `).join('');

            // Configuration de l'audio
            await this.setupAudioForSurah(number);

            // Appliquer la taille de police sauvegardée
            this.loadFontSize();
            this.updateFontSize();

        } catch (error) {
            console.error('Erreur lors du chargement de la sourate:', error);
        }
    }

    async setupAudioForSurah(surahNumber) {
        console.log('Setting up audio for surah:', surahNumber);
        
        // Nettoyer les sons précédents
        this.sounds.forEach(sound => sound.unload());
        this.sounds = [];
        this.currentAyah = 0;

        try {
            // Récupérer le nombre total d'ayahs pour cette sourate
            const response = await fetch(`${this.baseApiUrl}/surah/${surahNumber}`);
            const data = await response.json();
            this.totalAyahs = data.data.numberOfAyahs;
            console.log('Total ayahs:', this.totalAyahs);

            // Charger tous les fichiers audio
            for (let ayah = 1; ayah <= this.totalAyahs; ayah++) {
                const formattedSurah = String(surahNumber).padStart(3, '0');
                const formattedAyah = String(ayah).padStart(3, '0');
                const audioUrl = `${this.reciterUrls[this.reciter]}/${formattedSurah}${formattedAyah}.mp3`;
                
                const sound = new Howl({
                    src: [audioUrl],
                    html5: true,
                    preload: true,
                    volume: this.volume / 100,
                    format: ['mp3'],
                    onend: () => {
                        // Passer au verset suivant
                        if (this.currentAyah < this.totalAyahs - 1) {
                            this.currentAyah++;
                            this.playCurrentAyah();
                        } else {
                            // Fin de la sourate
                            this.stopProgressUpdate();
                            this.isPlaying = false;
                            this.currentAyah = 0;
                            this.updateProgressBar(100);
                            const playButton = document.getElementById('playButton');
                            if (playButton) {
                                playButton.innerHTML = '<i class="fas fa-play"></i>';
                            }
                        }
                    }
                });

                this.sounds.push(sound);
            }

            // Mettre à jour l'interface
            this.updateProgressBar(0);
            const timeDisplay = document.getElementById('time-display');
            if (timeDisplay) {
                timeDisplay.textContent = '00:00 / --:--';
            }

            return Promise.resolve();
        } catch (error) {
            console.error('Error setting up audio:', error);
            const quranVerses = document.querySelector('.quran-verses');
            if (quranVerses) {
                quranVerses.innerHTML = `
                    <div class="error-message">
                        <p>Erreur lors du chargement audio</p>
                        <p>Veuillez réessayer ou choisir une autre sourate.</p>
                    </div>
                `;
            }
            return Promise.reject(error);
        }
    }

    playCurrentAyah() {
        if (this.currentAyah < this.sounds.length) {
            console.log('Playing ayah:', this.currentAyah + 1);
            this.sounds[this.currentAyah].play();
            this.highlightCurrentAyah();
        }
    }

    getTotalDuration() {
        return this.sounds.reduce((total, sound) => total + (sound.duration() || 0), 0);
    }

    getCurrentTotalTime() {
        let time = 0;
        for (let i = 0; i < this.currentAyah; i++) {
            time += this.sounds[i].duration() || 0;
        }
        if (this.currentAyah < this.sounds.length) {
            time += this.sounds[this.currentAyah].seek() || 0;
        }
        return time;
    }

    highlightCurrentAyah() {
        // Retirer la surbrillance précédente
        document.querySelectorAll('.verse').forEach(verse => {
            verse.classList.remove('current-verse');
        });

        // Ajouter la surbrillance au verset actuel
        const currentVerse = document.querySelector(`.verse[data-verse="${this.currentAyah + 1}"]`);
        if (currentVerse) {
            currentVerse.classList.add('current-verse');
            currentVerse.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    showError(message) {
        const quranVerses = document.querySelector('.quran-verses');
        if (quranVerses) {
            quranVerses.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                    <p>Veuillez réessayer ou choisir une autre sourate.</p>
                </div>
            `;
        }
    }

    updateFontSize() {
        console.log('Updating font size');
        const fontSize = this.fontSize || 24; // Valeur par défaut si non définie
        
        // Mise à jour de l'affichage de la taille
        const fontSizeRange = document.getElementById('fontSizeRange');
        const fontSizeValue = document.querySelector('.font-size-value');
        
        if (fontSizeRange) {
            fontSizeRange.value = fontSize;
        }
        
        if (fontSizeValue) {
            fontSizeValue.textContent = `${fontSize}px`;
        }

        // Application de la taille aux versets
        const arabicTexts = document.querySelectorAll('.arabic-text');
        arabicTexts.forEach(text => {
            if (text) {
                text.style.fontSize = `${fontSize}px`;
            }
        });

        // Sauvegarder la taille
        localStorage.setItem('quranFontSize', fontSize);
    }

    loadFontSize() {
        const savedSize = localStorage.getItem('quranFontSize');
        this.fontSize = savedSize ? parseInt(savedSize) : 24;
        console.log('Loaded font size:', this.fontSize);
    }

    initializeFontSizeControl() {
        const fontSizeRange = document.getElementById('fontSizeRange');
        if (fontSizeRange) {
            fontSizeRange.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                this.updateFontSize();
            });
        }
    }

    initializeAudioControls() {
        console.log('Initializing audio controls');
        
        // Gestion du clic sur la barre de progression
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                if (!this.sound || !this.sound.duration()) return;
                
                const rect = progressContainer.getBoundingClientRect();
                const clickPosition = e.clientX - rect.left;
                const percent = clickPosition / rect.width;
                const seekTime = this.sound.duration() * percent;
                
                console.log('Seeking to:', seekTime, 'seconds');
                this.sound.seek(seekTime);
                this.updateProgressBar(percent * 100);
            });
        }

        // Gestion du volume
        const volumeControl = document.getElementById('volume');
        if (volumeControl) {
            volumeControl.addEventListener('input', (e) => {
                const value = e.target.value;
                console.log('Setting volume to:', value);
                this.setVolume(value);
            });
        }

        // Gestion du bouton play/pause
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                if (this.isPlaying) {
                    console.log('Pausing audio');
                    this.pause();
                } else {
                    console.log('Starting audio');
                    this.play();
                }
            });
        }

        // Gestion du bouton stop
        const stopButton = document.getElementById('stop');
        if (stopButton) {
            stopButton.addEventListener('click', () => {
                console.log('Stopping audio');
                this.stop();
            });
        }
    }

    startProgressUpdate() {
        console.log('Starting progress updates');
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        // Mettre à jour plus fréquemment pour une animation plus fluide
        this.progressInterval = setInterval(() => {
            if (this.sounds.length > 0 && this.currentAyah < this.sounds.length) {
                const currentSound = this.sounds[this.currentAyah];
                if (currentSound && currentSound.playing()) {
                    this.updateProgress();
                }
            }
        }, 50); // Mise à jour toutes les 50ms
    }

    updateProgress() {
        if (this.sounds.length > 0 && this.currentAyah < this.sounds.length) {
            const currentSound = this.sounds[this.currentAyah];
            if (currentSound && currentSound.playing()) {
                const seek = currentSound.seek() || 0;
                const duration = currentSound.duration() || 0;
                
                // Calculer la progression totale
                let totalProgress = 0;
                
                // Ajouter la progression des versets précédents
                for (let i = 0; i < this.currentAyah; i++) {
                    totalProgress += 1;
                }
                
                // Ajouter la progression du verset actuel
                if (duration > 0) {
                    totalProgress += (seek / duration);
                }
                
                // Convertir en pourcentage
                const percent = (totalProgress / this.totalAyahs) * 100;
                this.updateProgressBar(percent);

                // Mettre à jour l'affichage du temps
                const timeDisplay = document.getElementById('time-display');
                if (timeDisplay) {
                    const totalDuration = this.getTotalDuration();
                    const currentTime = this.getCurrentTotalTime();
                    timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(totalDuration)}`;
                }
            }
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    setVolume(value) {
        this.volume = value;
        if (this.sounds.length > 0) {
            this.sounds.forEach(sound => sound.volume(value / 100));
        }
        localStorage.setItem('quranPlayerVolume', value);
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

    loadUserProgress() {
        // Charger les progrès de l'utilisateur depuis le localStorage
        const progress = JSON.parse(localStorage.getItem('quranProgress')) || {
            completedSurahs: [],
            listeningTime: 0,
            favoriteVerses: []
        };
        
        this.updateProgress(progress);
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

    playNextSurah() {
        const nextSurahNumber = this.currentSurah + 1;
        if (nextSurahNumber <= 114) {
            this.loadSurah(nextSurahNumber);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuranPlayer();
});