class BackgroundManager {
    constructor(configManager, videoBackground) {
        this.configManager = configManager;
        this.videoBackground = videoBackground;
        this.backgroundGroups = {
            1: {
                name: 'Montana',
                videos: [
                    "https://videos.pexels.com/video-files/2941521/2941521-hd_1920_1080_24fps.mp4",
                    "https://videos.pexels.com/video-files/2711111/2711111-uhd_2560_1440_24fps.mp4",
                    "https://videos.pexels.com/video-files/3578887/3578887-uhd_2560_1440_30fps.mp4",
                    "https://videos.pexels.com/video-files/2453856/2453856-uhd_2560_1440_24fps.mp4"
                ]
            },
            2: {
                name: 'Ganadería',
                videos: [
                    "https://videos.pexels.com/video-files/18084154/18084154-uhd_2560_1440_50fps.mp4",
                    "https://videos.pexels.com/video-files/32119002/13693117_1920_1080_60fps.mp4",
                    "https://videos.pexels.com/video-files/4928679/4928679-sd_960_506_25fps.mp4",
                    "https://videos.pexels.com/video-files/13277312/13277312-uhd_2560_1440_30fps.mp4"
                ]
            },
            3: {
                name: 'Estándar',
                videos: [
                    "https://videos.pexels.com/video-files/854315/854315-hd_1920_1080_25fps.mp4",
                    "https://videos.pexels.com/video-files/856065/856065-hd_1920_1080_30fps.mp4",
                    "https://videos.pexels.com/video-files/4303612/4303612-hd_1920_1080_25fps.mp4",
                    "https://videos.pexels.com/video-files/10885104/10885104-uhd_2560_1440_24fps.mp4"
                ]
            },
            4: {
                name: 'Texas',
                videos: [
                    "https://videos.pexels.com/video-files/27360003/12124117_2560_1440_24fps.mp4",
                    "https://videos.pexels.com/video-files/8644762/8644762-uhd_2732_1440_24fps.mp4",
                    "https://videos.pexels.com/video-files/3987730/3987730-hd_1920_1080_24fps.mp4",
                    "https://videos.pexels.com/video-files/30259809/12972591_2560_1440_60fps.mp4",
                    "https://videos.pexels.com/video-files/7049943/7049943-hd_1920_1080_30fps.mp4"
                ]
            }
        };

        const savedGroupName = this.configManager.getConfig('backgroundGroup') || 'Montana';
        this.selectedGroup = this.getGroupIdByName(savedGroupName);
        console.log('Grupo seleccionado al iniciar:', savedGroupName, 'ID:', this.selectedGroup);

        this.setupBackgroundControls();
        this.applyBackground();
    }

    getGroupIdByName(groupName) {
        const groupEntry = Object.entries(this.backgroundGroups).find(
            ([, group]) => group.name.toLowerCase() === groupName.toLowerCase()
        );
        return groupEntry ? parseInt(groupEntry[0]) : 1;
    }

    getGroupNameById(groupId) {
        return this.backgroundGroups[groupId]?.name || 'Montana';
    }

    // Add showToast method for Toastify notifications
showToast(message, type = 'info', options = {}) {
    const { duration = 3000, showIcon = true } = options;
    
    // Preparar el contenido
    let content;
    if (showIcon) {
        content = `<div class="toast-content"><span class="toast-icon"></span>${message}</div>`;
    } else {
        content = `<div class="toast-content">${message}</div>`;
        type = 'no-icon';
    }
    
    Toastify({
        text: content,
        duration: duration,
        close: true,
        gravity: 'top',
        position: 'right',
        className: `toast-${type}`,
        escapeMarkup: false,
        stopOnFocus: true,
        style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: '0'
        }
    }).showToast();
}

    setupBackgroundControls() {
        const buttons = document.querySelectorAll('.background-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => this.selectBackgroundGroup(parseInt(button.dataset.group)));
            button.addEventListener('mouseenter', () => this.showPreview(parseInt(button.dataset.group)));
            button.addEventListener('mouseleave', () => this.hidePreview(parseInt(button.dataset.group)));
        });
        this.initializePreviews();
        this.updateButtonSelection();
    }

    initializePreviews() {
        const previewVideos = document.querySelectorAll('.group-preview-video');
        previewVideos.forEach(video => {
            const groupId = parseInt(video.dataset.group);
            if (this.backgroundGroups[groupId]) {
                video.src = this.backgroundGroups[groupId].videos[0];
                video.play().catch(error => {
                    const parent = video.parentElement;
                    const overlay = document.createElement('div');
                    overlay.className = 'play-overlay';
                    overlay.innerHTML = '<span>▶</span>';
                    overlay.style.position = 'absolute';
                    overlay.style.top = '50%';
                    overlay.style.left = '50%';
                    overlay.style.transform = 'translate(-50%, -50%)';
                    overlay.style.color = 'white';
                    overlay.style.fontSize = '30px';
                    overlay.style.cursor = 'pointer';
                    parent.appendChild(overlay);
                    overlay.addEventListener('click', () => {
                        video.play();
                        overlay.remove();
                    }, { once: true });
                });
            }
        });
    }

    selectBackgroundGroup(groupId) {
        if (this.backgroundGroups[groupId]) {
            this.selectedGroup = groupId;
            const groupName = this.getGroupNameById(this.selectedGroup);
            this.configManager.setConfig('backgroundGroup', groupName);
            console.log('Guardando grupo seleccionado:', groupName);

            // Show toast notification for the activated group
            this.showToast(`Grupo ${groupName} activado`, 'success');

            this.applyBackground();
            this.updateButtonSelection();
        }
    }

    applyBackground() {
        if (this.videoBackground) {
            const selectedGroup = this.backgroundGroups[this.selectedGroup];
            this.videoBackground.updateVideoSources(selectedGroup.videos);
        }
    }

    updateButtonSelection() {
        const buttons = document.querySelectorAll('.background-btn');
        buttons.forEach(button => {
            button.classList.toggle('selected', parseInt(button.dataset.group) === this.selectedGroup);
        });
    }

    showPreview(groupId) {
        const previewVideo = document.querySelector(`.group-preview-video[data-group="${groupId}"]`);
        if (previewVideo && this.backgroundGroups[groupId]) {
            const firstVideo = this.backgroundGroups[groupId].videos[0];
            previewVideo.src = firstVideo;
            previewVideo.play().catch(error => {
                // Silently handle autoplay block
            });
        }
    }

    hidePreview(groupId) {
        const previewVideo = document.querySelector(`.group-preview-video[data-group="${groupId}"]`);
        if (previewVideo) {
            previewVideo.pause();
        }
    }
}