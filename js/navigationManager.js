class NavigationManager {
    constructor(videoBackground, dashboardManager, animalManager, vaccineManager) {
        this.mainContent = document.getElementById('main-content');
        this.videoBackground = videoBackground;
        this.dashboardManager = dashboardManager;
        this.animalManager = animalManager;
        this.vaccineManager = vaccineManager;
    }

    initSystem() {
        this.hideSystem();
        this.setupNavigation();
        
        document.addEventListener('accessGranted', (event) => {
            console.log("Evento accessGranted recibido, mostrando sistema...");
            this.showSystem();
            // Renderizar la sección activa por defecto (dashboard)
            const activeSection = document.querySelector('.section.active');
            if (activeSection) {
                const sectionId = activeSection.id;
                console.log(`Renderizando sección activa por defecto: ${sectionId}`);
                if (sectionId === 'ganado') this.animalManager.renderAnimals();
                else if (sectionId === 'sanidad') this.vaccineManager.renderVaccines();
                else if (sectionId === 'dashboard') this.dashboardManager.updateDashboard();
                else if (sectionId === 'admin' || sectionId === 'embriones') {
                    this.handleSectionChange(sectionId);
                }
            }
            console.log("Usuario logueado:", event.detail.userName);
        });
    }
    
    showSystem() {
        console.log("Ejecutando showSystem...");
        this.videoBackground.hide();
        if (this.mainContent) {
            this.mainContent.style.display = 'grid';
            this.mainContent.classList.remove('hidden');
            this.mainContent.classList.add('visible');
            console.log("main-content mostrado con display: grid y clase visible");
        } else {
            console.error("Error: main-content no encontrado en el DOM");
        }
        const keypad = document.getElementById('keypad-overlay');
        if (keypad) {
            keypad.style.display = 'none';
            console.log("keypad-overlay ocultado");
        } else {
            console.error("Error: keypad-overlay no encontrado en el DOM");
        }
    }
    
    hideSystem() {
        console.log("Ejecutando hideSystem...");
        this.videoBackground.show();
        if (this.mainContent) {
            this.mainContent.style.display = 'none';
            this.mainContent.classList.add('hidden');
            this.mainContent.classList.remove('visible');
            console.log("main-content ocultado con display: none y clase hidden");
        }
    }
    
    setupNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        const sections = document.querySelectorAll('.section');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                menuItems.forEach(i => i.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                item.classList.add('active');
                const sectionId = item.dataset.section;
                document.getElementById(sectionId).classList.add('active');
                console.log(`Sección activada: ${sectionId}`);
                
                if (sectionId === 'ganado') this.animalManager.renderAnimals();
                else if (sectionId === 'sanidad') this.vaccineManager.renderVaccines();
                else if (sectionId === 'dashboard') this.dashboardManager.updateDashboard();
                else if (sectionId === 'admin' || sectionId === 'embriones') {
                    this.handleSectionChange(sectionId);
                }

                document.dispatchEvent(new CustomEvent('sectionChange', { detail: { section: sectionId } }));
            });
        });
    }

    handleSectionChange(sectionId) {
        console.log(`Manejando cambio de sección: ${sectionId}`);
    }
}

// Exportar la clase si usas módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}