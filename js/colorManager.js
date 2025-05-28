class ColorManager {
    constructor(configManager) {
        this.configManager = configManager; // Add ConfigManager dependency

        // Default palette matching the CSS :root
        this.defaultPalette = {
            '--animal-card-cart': '#ffff',
            '--color-primary': '#4a6fa5',
            '--color-primary-dark': '#2c3e50',
            '--color-primary-light': '#5a82ba',
            '--color-accent': '#6d9bc3',
            '--color-secondary': '#f0c929',
            '--color-tertiary': '#99582a',
            '--color-success': '#208624',
            '--color-error': '#e11e1e',
            '--color-bg-light': '#f9f9f9',
            '--color-bg-dark': '#34495e',
            '--color-text': '#333',
            '--color-text-light': '#757575',
            '--color-text-white': '#ffffff',
            '--color-border': '#e0e0e0',
            '--shadow-soft': '0 4px 20px rgba(0,0,0,0.08)',
            '--shadow-strong': '0 8px 30px rgba(0,0,0,0.2)'
        };

        // Predefined theme variations
        this.themes = {
            'default': this.defaultPalette,
            'ocean': {
                '--animal-card-cart': '#ffff',
                '--color-primary': '#3b5e8a',
                '--color-primary-dark': '#1f2a44',
                '--color-primary-light': '#4f7aa5',
                '--color-accent': '#5b89b0',
                '--color-secondary': '#e6b800',
                '--color-tertiary': '#8a4f22',
                '--color-bg-light': '#eef6f9',
                '--color-bg-dark': '#2e4a66'
            },
            'forest': {
                '--color-primary': '#426b69',
                '--color-primary-dark': '#2a3e3d',
                '--color-primary-light': '#558786',
                '--color-accent': '#6a9b9a',
                '--color-secondary': '#d4a017',
                '--color-tertiary': '#7a4a22',
                '--color-bg-light': '#f0f5f2',
                '--color-bg-dark': '#3c5c5a'
            },
            'desert': {
                '--animal-card-cart': '#ffff',
                '--color-primary': '#6d5b3a',
                '--color-primary-dark': '#4a3e2c',
                '--color-primary-light': '#8a6f4f',
                '--color-accent': '#8a7a5f',
                '--color-secondary': '#d4a017',
                '--color-tertiary': '#7a4a22',
                '--color-bg-light': '#f5ece3',
                '--color-bg-dark': '#5c4a3a'
            },
            'arctic': {
                '--color-primary': '#4a7fa5',
                '--color-primary-dark': '#2c5060',
                '--color-primary-light': '#6a9bc3',
                '--color-accent': '#87a8c3',
                '--color-secondary': '#e0e6e9',
                '--color-tertiary': '#6d7a8a',
                '--color-bg-light': '#f0f4f7',
                '--color-bg-dark': '#3e5a6a'
            },
            'night': {
                '--background-color': 'none',
                '--color-primary': '#2c3e50',
                '--color-primary-dark': '#1f2a38',
                '--color-primary-light': '#4a6f8a',
                '--color-accent': '#4a6f8a',
                '--color-secondary': '#b59f3b',
                '--color-tertiary': '#6d5b3a',
                '--color-success': '#208624',
                '--color-error': '#e11e1e',
                '--color-bg-light': '#2c3e50',
                '--color-bg-dark': '#1f2a38',
                '--color-text': '#ffff',
                '--color-text-light': '#b0b0b0',
                '--color-border': '#4a5e70',
                '--shadow-soft': '0 4px 20px rgba(0,0,0,0.3)',
                '--shadow-strong': '0 8px 30px rgba(0,0,0,0.5)'
                

            },
'pink': {
    '--animal-card-cart': '#ffffff',
    '--color-primary': '#f8bbd0',           // rosa pastel suave
    '--color-primary-dark': '#ec92af',      // rosa un poco más intenso
    '--color-primary-light': '#fce4ec',     // fondo rosado claro
    '--color-accent': '#f3accb',            // acento rosa suave
    '--color-secondary': '#e1bee7',         // lila claro
    '--color-tertiary': '#dba0c0',          // rosa-lavanda
    '--color-bg-light': '#fff5fa',          // fondo muy claro
    '--color-bg-dark': '#b388a2'            // rosado grisáceo suave
}
        };

        // Retrieve saved theme name or default to "default"
        this.currentTheme = this.configManager.getConfig('selectedTheme') || 'default';
        console.log('Tema seleccionado al iniciar:', this.currentTheme);
    }

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

    applyTheme(themeName) {
        if (!this.themes[themeName]) return;
        this.currentTheme = themeName;
        const theme = this.themes[themeName];
        const mergedTheme = { ...this.defaultPalette, ...theme };

        // Update :root variables globally
        const root = document.documentElement;
        Object.keys(mergedTheme).forEach(key => {
            root.style.setProperty(key, mergedTheme[key]);
        });

        this.updateThemePreviews();

        // Save the selected theme to local storage
        this.configManager.setConfig('selectedTheme', this.currentTheme);
        console.log('Guardando tema seleccionado:', this.currentTheme);

        // Show toast notification for the activated theme
        this.showToast(`Tema ${themeName} activado`, 'success');
    }

    updateThemePreviews() {
        const previews = document.querySelectorAll('.theme-preview');
        previews.forEach(preview => {
            const themeName = preview.dataset.theme;
            const theme = this.themes[themeName];
            if (theme) {
                preview.style.backgroundColor = theme['--color-bg-light'] || this.defaultPalette['--color-bg-light'];
                preview.style.borderColor = theme['--color-primary'] || this.defaultPalette['--color-primary'];
                const text = preview.querySelector('.preview-text');
                if (text) {
                    text.style.color = theme['--color-text'] || this.defaultPalette['--color-text'];
                }
            }
        });
    }

    initConfigUI() {
        const section = document.querySelector('.section-2-config');
        if (!section) {
            console.error('Section-2-config not found during initConfigUI at:', new Date().toISOString());
            return;
        }

        const themeButtons = document.querySelectorAll('.theme-btn');
        if (themeButtons.length === 0) {
            console.log('No theme buttons found at:', new Date().toISOString());
            return;
        }
        console.log('Theme buttons found, attaching listeners at:', new Date().toISOString());

        themeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const themeName = e.target.dataset.theme;
                this.applyTheme(themeName);
                themeButtons.forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        this.updateThemePreviews();
    }
}

// Initialize independently on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ColorManager standalone at:', new Date().toISOString());
    const configManager = new ConfigManager(); // Instantiate ConfigManager
    const colorManager = new ColorManager(configManager);
    colorManager.initConfigUI();
    colorManager.applyTheme(colorManager.currentTheme); // Apply the saved or default theme on load
});