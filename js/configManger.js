class ConfigManager {
    constructor() {
        this.configServerUrl = 'http://localhost:3000/config'; // URL del servidor de configuración
        this.config = this.getDefaultConfig(); // Configuración por defecto
        this.loadConfig(); // Cargar configuración al inicializar
    }

    getDefaultConfig() {
        return {
            upcomingEventDays: 7, // Días para eventos próximos
            weightUnit: 'kg', // Unidad de peso predeterminada
            language: 'es', // Idioma predeterminado
            apiTimeout: 5000, // Timeout para API en milisegundos
            backgroundGroup: 1 // Default to Montana (Group 1)
        };
    }

    async loadConfig() {
        try {
            // Intentar cargar desde el servidor
            const response = await fetch(this.configServerUrl);
            if (response.ok) {
                const serverConfig = await response.json();
                this.config = { ...this.getDefaultConfig(), ...serverConfig };
                console.log('Configuración cargada desde el servidor:', this.config);
            } else {
                throw new Error('No se pudo cargar la configuración desde el servidor');
            }
        } catch (error) {
        
            // Fallback a localStorage si el servidor falla
            const localConfig = localStorage.getItem('appConfig');
            if (localConfig) {
                this.config = { ...this.getDefaultConfig(), ...JSON.parse(localConfig) };
                console.log('Configuración cargada desde localStorage:', this.config);
            } else {
                console.log('Usando configuración por defecto:', this.config);
            }
        }
    }

    async saveConfig() {
        try {
            // Guardar en el servidor
            const response = await fetch(this.configServerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.config)
            });

            if (!response.ok) {
                throw new Error('No se pudo guardar la configuración en el servidor');
            }
            console.log('Configuración guardada en el servidor:', this.config);
        } catch (error) {
            console.warn('Error al guardar en el servidor, usando localStorage:', error);
            // Fallback a localStorage si el servidor falla
            localStorage.setItem('appConfig', JSON.stringify(this.config));
            console.log('Configuración guardada en localStorage:', this.config);
        }
    }

  getConfig(key) {
        return localStorage.getItem(key);
    }

    setConfig(key, value) {
        localStorage.setItem(key, value);
        this.saveConfig(); // Guardar cada vez que se actualiza una configuración
    }




}