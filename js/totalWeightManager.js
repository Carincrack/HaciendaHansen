class TotalWeightManager {
    constructor() {
        this.totalWeightElement = null;
        this.totalWeight = 0;
        this.maxRetries = 10;
        this.retryInterval = 1000;
        this.retryCount = 0;

        this.init();
    }

    init() {
        this.attemptToFindElements();

        // Escuchar eventos de actualización de animales
        document.addEventListener('animalAdded', () => {
            console.log('Evento animalAdded recibido para peso total');
            this.updateWeight();
        });

        document.addEventListener('animalDeleted', () => {
            console.log('Evento animalDeleted recibido para peso total');
            this.updateWeight();
        });

        // Forzar actualización inicial
        this.updateWeight();

        // Actualización periódica (opcional, para depuración)
        setInterval(() => this.updateWeight(), 10000); // Actualizar cada 10 segundos
    }

    attemptToFindElements() {
        this.totalWeightElement = document.getElementById('total-weight');

        if (!this.totalWeightElement) {
            console.warn(`Intento ${this.retryCount + 1}: Elemento #total-weight no encontrado en el DOM`);
            this.retryCount++;
            if (this.retryCount < this.maxRetries) {
                setTimeout(() => this.attemptToFindElements(), this.retryInterval);
            } else {
                console.error('No se pudo encontrar #total-weight después de varios intentos');
            }
            return;
        }

        console.log('Elemento #total-weight encontrado:', this.totalWeightElement);

        // Forzar actualización inicial
        this.updateWeight();
    }

    async updateWeight() {
        if (!this.totalWeightElement) {
            console.warn('No se puede actualizar: #total-weight no está definido');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/animals');
            if (!response.ok) throw new Error(`Error al obtener los animales: ${response.statusText}`);
            const animals = await response.json();

            console.log('Animales obtenidos del servidor:', animals);

            if (!Array.isArray(animals)) {
                throw new Error('La respuesta del servidor no es un array de animales');
            }

            this.totalWeight = animals.reduce((sum, animal) => {
                const weightInKg = parseFloat(animal.weight) || 0;
                console.log(`Peso de ${animal.name}: ${weightInKg} kg`);
                return sum + weightInKg;
            }, 0);

            this.updateDisplay();
            console.log('Peso total calculado:', this.totalWeight);
        } catch (error) {
            console.error('Error al actualizar peso total:', error);
            this.totalWeightElement.textContent = 'N/A';
        }
    }

    formatNumberWithThousandsSeparator(number) {
        // Convertir el número a string con dos decimales
        const fixedNumber = number.toFixed(2);
        // Separar la parte entera y decimal
        const [integerPart, decimalPart] = fixedNumber.split('.');
        // Agregar puntos como separadores de miles a la parte entera
        const integerWithSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        // Combinar la parte entera y decimal
        return `${integerWithSeparators}.${decimalPart}`;
    }

    updateDisplay() {
        if (!this.totalWeight) {
            this.totalWeightElement.textContent = 'N/A';
            return;
        }

        let displayValue;
        if (this.totalWeight >= 1000) {
            // Convertir a toneladas y formatear como X.X.XXT
            const tons = this.totalWeight / 1000;
            displayValue = `${this.formatNumberWithThousandsSeparator(tons)}T`;
        } else {
            // Mostrar en kg como XXX.XXkg
            displayValue = `${this.formatNumberWithThousandsSeparator(this.totalWeight)}kg`;
        }
        this.totalWeightElement.textContent = displayValue;
    }
}

window.TotalWeightManager = TotalWeightManager;

// Instanciar TotalWeightManager automáticamente
document.addEventListener('DOMContentLoaded', () => {
    new TotalWeightManager();
});