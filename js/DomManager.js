class DomManager {
    constructor(colorManager) {
        this.colorManager = colorManager; // Use MainSystem's instance
        this.init();
    }

    init() {
        console.log('DomManager initialized at:', new Date().toISOString());
        // Wait for accessGranted event from MainSystem
        document.addEventListener('accessGranted', () => {
            console.log('accessGranted received in DomManager at:', new Date().toISOString());
            this.setupTheme();
        }, { once: true });

        // Fallback in case accessGranted doesn't fire within 2 seconds
        setTimeout(() => {
            if (!document._accessGrantedFired) {
                console.warn('accessGranted not received, forcing theme setup at:', new Date().toISOString());
                this.setupTheme();
            }
        }, 2000);
    }

    setupTheme() {
        // Add .theme-applied class to relevant DOM elements (optional, since we're updating :root)
        const mainContent = document.getElementById('main-content');
        const sectionConfig = document.querySelector('.section-2-config');
        if (mainContent) {
            console.log('Found main-content at:', new Date().toISOString());
        } else {
            console.error('main-content element not found at:', new Date().toISOString());
        }
        if (sectionConfig) {
            console.log('Found section-2-config at:', new Date().toISOString());
        } else {
            console.error('section-2-config element not found at:', new Date().toISOString());
        }

        // Initialize ColorManager UI
        this.colorManager.initConfigUI();
        this.colorManager.applyTheme(this.colorManager.currentTheme); // Apply default theme
        document._accessGrantedFired = true; // Mark as fired for fallback
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing DomManager at:', new Date().toISOString());
    // Wait for MainSystem to be available
    const waitForMainSystem = () => {
        if (window.mainSystem && window.mainSystem.colorManager) {
            window.domManager = new DomManager(window.mainSystem.colorManager);
        } else {
            setTimeout(waitForMainSystem, 100);
        }
    };
    waitForMainSystem();
});