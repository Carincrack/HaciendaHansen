class VideoBackground {
    constructor() {
        this.videoPlayer = document.getElementById('video-player');
        this.appContainer = document.getElementById('app-container');
        this.keypadBackground = null;
        this.videoSources = []; // Will be set by BackgroundManager
        this.currentIndex = 0;
        this.transitionDuration = 800;
        this.setupVideoBackground();
    }
    
    setupVideoBackground() {
        this.keypadBackground = document.getElementById('keypad-background');
        if (!this.keypadBackground) {
            this.keypadBackground = document.createElement('div');
            this.keypadBackground.id = 'keypad-background';
            this.keypadBackground.style.position = 'fixed';
            this.keypadBackground.style.top = '0';
            this.keypadBackground.style.left = '0';
            this.keypadBackground.style.width = '100%';
            this.keypadBackground.style.height = '100%';
            this.keypadBackground.style.overflow = 'hidden';
            this.keypadBackground.style.zIndex = '-1';
            this.keypadBackground.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            this.keypadBackground.style.transition = `opacity ${this.transitionDuration}ms ease`;
            
            if (this.appContainer) {
                this.appContainer.insertBefore(this.keypadBackground, this.appContainer.firstChild);
            } else {
                document.body.insertBefore(this.keypadBackground, document.body.firstChild);
            }
        }
        
        if (this.appContainer) {
            this.appContainer.style.backgroundColor = '#000';
        }
        
        if (this.videoPlayer) {
            if (this.videoPlayer.parentNode !== this.keypadBackground) {
                this.keypadBackground.appendChild(this.videoPlayer);
            }
            this.videoPlayer.style.position = 'absolute';
            this.videoPlayer.style.top = '50%';
            this.videoPlayer.style.left = '50%';
            this.videoPlayer.style.transform = 'translate(-50%, -50%)';
            this.videoPlayer.style.minWidth = '100%';
            this.videoPlayer.style.minHeight = '100%';
            this.videoPlayer.style.width = 'auto';
            this.videoPlayer.style.height = 'auto';
            this.videoPlayer.style.objectFit = 'cover';
            this.videoPlayer.style.opacity = '1';
            this.videoPlayer.style.backgroundColor = 'transparent';
            this.videoPlayer.style.transition = `opacity ${this.transitionDuration}ms ease`;
            this.videoPlayer.addEventListener('error', (e) => {
                console.error('Video error:', this.videoSources[this.currentIndex], e); // Temp debug
                this.transitionToNextVideo();
            });
            this.videoPlayer.addEventListener('stalled', () => {
                this.transitionToNextVideo();
            });

            if (this.videoSources.length > 0) {
                this.setVideoSource(this.currentIndex);
                this.handleAutoplay();
                this.setupIntersectionObserver();
                this.startVideoRotation();
            }
        }
    }
    
    setVideoSource(index) {
        if (index >= 0 && index < this.videoSources.length) {
            const sourceElement = this.videoPlayer.querySelector('source');
            if (sourceElement) {
                sourceElement.setAttribute('src', this.videoSources[index]);
            } else {
                const newSource = document.createElement('source');
                newSource.setAttribute('src', this.videoSources[index]);
                newSource.setAttribute('type', 'video/mp4');
                this.videoPlayer.appendChild(newSource);
            }
            this.videoPlayer.load();
            this.playVideo();
        }
    }
    
    handleAutoplay() {
        if (!this.videoPlayer) return;
        this.videoPlayer.muted = true;
        this.videoPlayer.loop = false; // Ensure loop is disabled
        const playPromise = this.videoPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                this.addUserInteractionListener();
            });
        }
    }
    
    addUserInteractionListener() {
        const keypadOverlay = document.getElementById('keypad-overlay');
        if (keypadOverlay) {
            keypadOverlay.addEventListener('click', this.handleUserInteraction.bind(this), { once: true });
        } else {
            document.addEventListener('click', this.handleUserInteraction.bind(this), { once: true });
        }
    }
    
    handleUserInteraction() {
        this.playVideo();
        const overlay = document.getElementById('video-activation-overlay');
        if (overlay) overlay.remove();
    }
    
    playVideo() {
        if (!this.videoPlayer) return;
        const playPromise = this.videoPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error('Play error:', error); // Temp debug
                    this.transitionToNextVideo();
                }
            });
        }
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.videoPlayer.paused) {
                    this.playVideo();
                } else if (!entry.isIntersecting) {
                    this.videoPlayer.pause();
                }
            });
        }, { threshold: 0.4 });
        observer.observe(this.videoPlayer);
    }
    
    startVideoRotation() {
        this.videoPlayer.addEventListener('ended', () => {
            this.transitionToNextVideo();
        }, { once: false }); // Allow multiple triggers
    }
    
    transitionToNextVideo() {
        if (this.videoSources.length === 0) return;
        this.videoPlayer.style.opacity = '0';
        this.keypadBackground.style.opacity = '0';
        setTimeout(() => {
            this.currentIndex = (this.currentIndex + 1) % this.videoSources.length;
            this.setVideoSource(this.currentIndex);
            this.keypadBackground.style.opacity = '1';
            this.videoPlayer.style.opacity = '1';
            if (this.videoPlayer.paused) {
                this.playVideo();
            }
        }, this.transitionDuration);
    }
    
    hide() {
        if (this.keypadBackground) {
            this.keypadBackground.style.opacity = '0';
            this.keypadBackground.style.pointerEvents = 'none';
            if (this.videoPlayer) {
                this.videoPlayer.pause();
                this.videoPlayer.style.opacity = '0';
            }
        }
    }
    
    show() {
        if (this.keypadBackground) {
            this.keypadBackground.style.opacity = '1';
            this.keypadBackground.style.pointerEvents = 'auto';
            this.videoPlayer.style.opacity = '1';
            this.playVideo();
        }
    }

    updateVideoSources(newSources) {
        this.videoSources = newSources;
        this.currentIndex = 0;
        this.setVideoSource(this.currentIndex);
        if (this.videoSources.length > 0) {
            this.handleAutoplay();
            this.setupIntersectionObserver();
            this.startVideoRotation();
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.videoBackground = new VideoBackground();
});