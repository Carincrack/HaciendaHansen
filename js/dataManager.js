class DataManager {
    constructor() {
        this.animals = [];
        this.vaccines = [];
        this.dataKey = 'haciendaData'; // Definir la clave para localStorage
    }

    async loadInitialData() {
        try {
            await this.loadAnimalFiles();
            await this.loadVaccineFiles();
            console.log("Datos cargados desde el servidor:", { animals: this.animals, vaccines: this.vaccines });
            this.syncLocalStorageWithServer();
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            this.loadDataFromLocalStorage();
            console.log("Datos cargados desde localStorage:", { animals: this.animals, vaccines: this.vaccines });
        }
    }

    async loadAnimalFiles() {
        try {
            const response = await fetch('http://localhost:3000/animals');
            if (!response.ok) {
                throw new Error('Error al cargar los animales desde el servidor');
            }
            this.animals = await response.json();
            console.log("Animales cargados desde el servidor:", this.animals);
            return true;
        } catch (error) {
            console.error("Error al cargar datos desde el servidor:", error);
            throw error;
        }
    }

    async loadVaccineFiles() {
        try {
            const response = await fetch('http://localhost:3000/api/vaccines');
            if (response.ok) {
                const data = await response.json();
                this.vaccines = data;
            }
        } catch (error) {
            console.error('Error al cargar datos de vacunas del servidor:', error);
        }
    }

    syncLocalStorageWithServer() {
        const photoKeys = Object.keys(localStorage).filter(key => key.startsWith('animalPhoto_'));
        const titlePhotoKeys = Object.keys(localStorage).filter(key => key.startsWith('animalTitlePhoto_'));
        const validRegistryIds = this.animals.map(animal => animal.registryId);

        photoKeys.forEach(key => {
            const registryId = key.replace('animalPhoto_', '');
            if (!validRegistryIds.includes(registryId)) {
                console.log(`Eliminando foto obsoleta de localStorage: ${key}`);
                localStorage.removeItem(key);
            }
        });

        titlePhotoKeys.forEach(key => {
            const registryId = key.replace('animalTitlePhoto_', '');
            if (!validRegistryIds.includes(registryId)) {
                console.log(`Eliminando foto de título obsoleta de localStorage: ${key}`);
                localStorage.removeItem(key);
            }
        });

        this.saveDataToLocalStorage();
    }

    loadDataFromLocalStorage() {
        const savedData = localStorage.getItem(this.dataKey);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.animals = data.animals || [];
                this.vaccines = data.vaccines || [];
            } catch (error) {
                console.error("Error al parsear datos de localStorage:", error);
            }
        }
    }

    async saveAnimalToFile(animalData) {
        try {
            const response = await fetch('http://localhost:3000/animals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(animalData),
            });

            if (!response.ok) {
                throw new Error('Error al guardar el animal en el servidor');
            }

            return true;
        } catch (error) {
            console.error("Error al guardar animal en el servidor:", error);
            this.saveDataToLocalStorage();
            throw error;
        }
    }

    async saveAllAnimals() {
        for (const animal of this.animals) {
            await this.saveAnimalToFile(animal);
        }
        this.saveDataToLocalStorage();
    }

    async deleteAnimalFile(animalId) {
        try {
            const response = await fetch(`http://localhost:3000/animals/${animalId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el animal en el servidor');
            }
        } catch (error) {
            console.error("Error al eliminar animal en el servidor:", error);
            throw error;
        }
    }

    getAnimals() { return this.animals; }
    setAnimals(animals) { this.animals = animals; }
    getVaccines() { return this.vaccines; }
    setVaccines(vaccines) { this.vaccines = vaccines; }

    saveDataToLocalStorage() {
        const data = {
            animals: this.animals,
            vaccines: this.vaccines,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem(this.dataKey, JSON.stringify(data));
    }
}

// Hacer DataManager global para el navegador
window.DataManager = DataManager;