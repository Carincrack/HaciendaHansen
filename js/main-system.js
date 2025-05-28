class MainSystem {
    constructor() {
        this.videoBackground = new VideoBackground();

        this.dataManager = new DataManager();
        this.dashboardManager = new DashboardManager(this.dataManager);
        this.animalManager = new AnimalManager(this.dataManager, this.dashboardManager);
        this.vaccineManager = new VaccineManager(this.dataManager, this.dashboardManager);
        this.navigationManager = new NavigationManager(
            this.videoBackground,
            this.dashboardManager,
            this.animalManager,
            this.vaccineManager
        );
        this.eventManager = new EventManager(
            this.navigationManager,
            this.animalManager,
            this.vaccineManager
        );

        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            // Load initial data (e.g., from localStorage or server)
            await this.dataManager.loadInitialData();
            this.navigationManager.initSystem();
            this.eventManager.initMainPanelEvents();
            this.dashboardManager.updateDashboard();
            this.vaccineManager.renderVaccines(); // Render vaccines in the Sanidad section

            // Set up logout functionality
            this.setupLogout();
        } catch (error) {
            console.error('Error initializing system:', error);
            alert('Ocurrió un error al inicializar el sistema. Por favor, recarga la página.');
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Show keypad overlay and hide main content
                const keypadOverlay = document.getElementById('keypad-overlay');
                const mainContent = document.getElementById('main-content');
                if (keypadOverlay && mainContent) {
                    keypadOverlay.classList.remove('hidden');
                    mainContent.classList.add('hidden');
                    // Reset dashboard and other sections if needed
                    this.dashboardManager.updateDashboard();
                }
            });
        } else {
            console.error('Logout button not found');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.mainSystem = new MainSystem();
});