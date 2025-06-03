class CapitalManager {
    constructor() {
        this.capitalBase = 0;
        this.exchangeRateColones = 1000; // Factor para colones
        this.exchangeRateDollars = 2;    // Factor para dólares
        this.pesoCapitalElement = null;
        this.currencyButtons = null;
        this.currentCurrency = 'colones'; // Mostrar en colones por defecto
        this.maxRetries = 10; // Máximo de intentos para encontrar el elemento
        this.retryInterval = 1000; // Intervalo entre intentos (1 segundo)
        this.retryCount = 0;

        this.init();
    }

    init() {
        // Intentar encontrar los elementos del DOM
        this.attemptToFindElements();

        // Escuchar eventos de actualización de animales
        document.addEventListener('animalAdded', () => {
            console.log('Evento animalAdded recibido');
            this.updateCapital();
        });

        document.addEventListener('animalDeleted', () => {
            console.log('Evento animalDeleted recibido');
            this.updateCapital();
        });

        // Forzar actualización inicial
        this.updateCapital();

        // Actualización periódica (opcional, para depuración)
        setInterval(() => this.updateCapital(), 10000); // Actualizar cada 10 segundos
    }

    attemptToFindElements() {
        this.pesoCapitalElement = document.getElementById('peso-capetal');
        this.currencyButtons = document.querySelectorAll('.btn-captal-container .btn-cambio');

        if (!this.pesoCapitalElement) {
            console.warn(`Intento ${this.retryCount + 1}: Elemento #peso-capetal no encontrado en el DOM`);
            this.retryCount++;
            if (this.retryCount < this.maxRetries) {
                setTimeout(() => this.attemptToFindElements(), this.retryInterval);
            } else {
                console.error('No se pudo encontrar #peso-capetal después de varios intentos');
            }
            return;
        }

        console.log('Elemento #peso-capetal encontrado:', this.pesoCapitalElement);

        if (!this.currencyButtons.length) {
            console.warn('Botones .btn-cambio no encontrados');
        } else {
            console.log('Botones .btn-cambio encontrados:', this.currencyButtons.length);
            // Configurar eventos para los botones de conversión
            this.currencyButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const currency = button.textContent.trim().toLowerCase();
                    this.convertAndShow(currency);
                });
            });
        }

        // Si encontramos el elemento, forzamos una actualización inicial
        this.updateCapital();
    }

    async updateCapital() {
        if (!this.pesoCapitalElement) {
            console.warn('No se puede actualizar: #peso-capetal no está definido');
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

            const totalWeightInTons = animals.reduce((sum, animal) => {
                const weightInKg = parseFloat(animal.weight) || 0;
                return sum + (weightInKg / 1000);
            }, 0);

            this.capitalBase = totalWeightInTons * 1200;
            this.updateDisplay(); // Actualizar la visualización según la moneda actual
            console.log('Capital calculado:', this.capitalBase);
        } catch (error) {
            console.error('Error al actualizar capital:', error);
            this.pesoCapitalElement.textContent = 'N/A';
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
        if (!this.capitalBase) {
            this.pesoCapitalElement.textContent = 'N/A';
            return;
        }

        let value;
        switch (this.currentCurrency) {
            case 'colones':
                value = this.capitalBase * this.exchangeRateColones;
                this.pesoCapitalElement.textContent = `₡${this.formatNumberWithThousandsSeparator(value)}`;
                break;
            case 'dollars':
                value = this.capitalBase * this.exchangeRateDollars;
                this.pesoCapitalElement.textContent = `$${this.formatNumberWithThousandsSeparator(value)}`;
                break;
            case 'base':
            default:
                value = this.capitalBase;
                this.pesoCapitalElement.textContent = `${this.formatNumberWithThousandsSeparator(value)}`;
                break;
        }
    }

    convertAndShow(currency) {
        if (!this.capitalBase) {
            this.pesoCapitalElement.textContent = 'N/A';
            return;
        }

        // Ajuste para manejar 'dolar' como 'dollars'
        this.currentCurrency = currency === 'colones' ? 'colones' : currency === 'dolar' ? 'dollars' : 'base';
        this.updateDisplay();
    }
}

window.CapitalManager = CapitalManager;

// Instanciar CapitalManager automáticamente
document.addEventListener('DOMContentLoaded', () => {
    new CapitalManager();
});