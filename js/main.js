document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando...');

    // Instanciar los managers y componentes
    const dataManager = new DataManager();
    const configManager = new ConfigManager(); // Add ConfigManager
    const dashboardManager = new DashboardManager(dataManager, configManager);
    const reportManager = new ReportManager(dataManager);
    const animalManager = new AnimalManager(dataManager, dashboardManager);
    const vaccineManager = new VaccineManager(dataManager, dashboardManager);
   

    // Instanciar VideoBackground
    const videoBackground = new VideoBackground(document.getElementById('video-player'));

    // Instanciar BackgroundManager
    const backgroundManager = new BackgroundManager(configManager, videoBackground);

    // Instanciar Keypad
    const keypad = new Keypad();

    // Instanciar NavigationManager
    const navigationManager = new NavigationManager(videoBackground, dashboardManager, animalManager, vaccineManager);

    // Instanciar MainSystem (coordinador, asumiendo que existe)
    const mainSystem = new MainSystem();

    // Inicializar el sistema
    navigationManager.initSystem();

    // Cargar datos iniciales y preparar renderizado tras autenticación
    dataManager.loadInitialData().then(() => {
        console.log('Datos iniciales cargados, esperando autenticación...');

        // Escuchar el evento accessGranted para renderizar después de que el sistema se muestre
        document.addEventListener('accessGranted', () => {
            console.log('Sistema mostrado, renderizando contenido...');
            animalManager.renderAnimals();
            vaccineManager.renderVaccines();
            dashboardManager.updateDashboard();
        }, { once: true });
    }).catch(error => {
        console.error('Error al cargar datos iniciales:', error);
        const messageDisplay = document.getElementById('message-display');
        if (messageDisplay) {
            messageDisplay.textContent = 'Error al cargar datos. Intente de nuevo.';
            messageDisplay.className = 'error-message';
        }
    });

    // Manejar logout
    document.addEventListener('logoutRequested', () => {
        // Mostrar nuevamente el keypad y el video de fondo
        const keypadOverlay = document.getElementById('keypad-overlay');
        if (keypadOverlay) {
            keypadOverlay.style.display = 'block';
            keypadOverlay.classList.remove('hide');
        }

        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.display = 'block';
            logoContainer.classList.remove('hide');
        }

        videoBackground.show(); // This will use the background group selected via BackgroundManager

        // Restablecer el PIN
        if (keypad.clearPin) {
            keypad.clearPin();
        }

        // Ocultar main-content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
            mainContent.classList.add('hidden');
            mainContent.classList.remove('visible');
        }
    });
});