class EventManager {
    constructor(navigationManager, animalManager, vaccineManager) {
        this.navigationManager = navigationManager;
        this.animalManager = animalManager;
        this.vaccineManager = vaccineManager;
        
    }

    initMainPanelEvents() {
        const addAnimalBtn = document.querySelector('#ganado .add-btn');
        if (addAnimalBtn) {
            addAnimalBtn.removeEventListener('click', this.animalManager.showAnimalForm);
            addAnimalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.animalManager.showAnimalForm();
            });
        }
        
        const addVaccineBtn = document.querySelector('#sanidad .add-btn');
        if (addVaccineBtn) {
            addVaccineBtn.removeEventListener('click', this.vaccineManager.showVaccineForm);
            addVaccineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.vaccineManager.showVaccineForm();
            });
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.navigationManager.hideSystem();
                document.dispatchEvent(new CustomEvent('logoutRequested'));
            });
        }
    }
}