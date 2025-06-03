class AdminMenuVisibility {
    constructor() {
        this.adminMenuItem = null;
        this.maxRetries = 10;
        this.retryInterval = 1000;
        this.retryCount = 0;
        this.requiredId = atob('ODg3MDE='); // Decodifica 'ODg3MDE=' a '87301'

        this.init();
    }

    init() {
        this.attemptToFindElements();

        // Escuchar eventos de acceso y logout
        document.addEventListener('accessGranted', () => {
            console.log('Evento accessGranted recibido');
            this.checkVisibility();
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('Evento logout detectado');
                this.checkVisibility();
            });
        }
    }

    attemptToFindElements() {
        this.adminMenuItem = document.querySelector('.menu-item.admin-conteiner[data-section="admin"]');

        if (!this.adminMenuItem) {
            console.warn(`Intento ${this.retryCount + 1}: Elemento .menu-item.admin-conteiner no encontrado en el DOM`);
            this.retryCount++;
            if (this.retryCount < this.maxRetries) {
                setTimeout(() => this.attemptToFindElements(), this.retryInterval);
            } else {
                console.error('No se pudo encontrar .menu-item.admin-conteiner después de varios intentos');
            }
            return;
        }

        console.log('Elemento .menu-item.admin-conteiner encontrado:', this.adminMenuItem);
        this.checkVisibility();
    }

    checkVisibility() {
        // Obtener el userId desde localStorage
        const userId = localStorage.getItem('userId') || '';
        console.log('userId obtenido de localStorage:', userId);
        console.log('requiredId esperado:', this.requiredId);

        // Comparar con el valor decodificado
        if (userId === this.requiredId) {
            this.adminMenuItem.style.display = 'block'; // Mostrar el elemento
            console.log('Acceso de administrador concedido: userId coincide con', this.requiredId);
        } else {
            this.adminMenuItem.style.display = 'none'; // Ocultar el elemento
            console.log('Acceso de administrador denegado: userId no coincide. userId:', userId, 'esperado:', this.requiredId);
        }
    }
}

window.AdminMenuVisibility = AdminMenuVisibility;

// Instanciar AdminMenuVisibility automáticamente
document.addEventListener('DOMContentLoaded', () => {
    new AdminMenuVisibility();
});