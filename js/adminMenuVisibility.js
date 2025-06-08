class AdminMenuVisibility {
    constructor() {
        this.adminMenuItem = null;

        // Permitir múltiples IDs válidos para acceso de administrador
        this.requiredIds = [atob('ODg3MDE='), atob('')]; //  ["50460"]

        this.init();
    }

    init() {
        // Intentar encontrar el elemento inmediatamente
        this.adminMenuItem = document.querySelector('.menu-item[data-section="admin"]');

        if (!this.adminMenuItem) {
            console.error('Elemento .menu-item[data-section="admin"] no encontrado en el DOM');
            return; // Salir si no se encuentra el elemento
        }

        console.log('Elemento .menu-item[data-section="admin"] encontrado:', this.adminMenuItem);

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

        // Verificar visibilidad inicial (por si localStorage ya tiene userId)
        this.checkVisibility();
    }

    checkVisibility() {
        const userId = localStorage.getItem('userId') || '';
        console.log('userId obtenido de localStorage:', userId);
        console.log('IDs permitidos para admin:', this.requiredIds);

        if (this.requiredIds.includes(userId)) {
            this.adminMenuItem.style.display = 'block'; // Mostrar para usuarios válidos
            console.log('Acceso de administrador concedido: userId coincide con uno de los permitidos');
        } else {
            this.adminMenuItem.style.display = 'none'; // Ocultar para cualquier otro userId
            console.log('Acceso de administrador denegado: userId no permitido');
        }
    }
}

// Exportar la clase si usas módulos, o asignarla a window para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminMenuVisibility;
} else {
    window.AdminMenuVisibility = AdminMenuVisibility;
}

// Inicializar la clase al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    new AdminMenuVisibility();
});
