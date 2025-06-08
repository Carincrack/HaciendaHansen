class Keypad {
    constructor() {
        // Lista de PINs válidos con sus usuarios correspondientes (encriptados en Base64)
        this.validPins = Object.freeze({
            "NTgzNjA=": "Scott",
            "NTA0NjA=": "Kevin", 
            "OTk5OTk=": "Kiana",
            "ODg3MDE=": "Ing Axel",
        });
        
        // Estado inicial
        this.toastEnabled = true;
        this.currentPin = "";
        this.isProcessing = false;
        
        // Referencias DOM
        this.pinDots = document.querySelectorAll('.pin-dot');
        this.messageDisplay = document.getElementById('message-display');
        this.keypadOverlay = document.getElementById('keypad-overlay');
        this.keys = document.querySelectorAll('.key');
        this.logoContainer = document.querySelector('.logo-container');
        
        // Bind de métodos para los listeners
        this.handlePhysicalKeyPress = this.handlePhysicalKeyPress.bind(this);
        this.handleKeyClick = this.handleKeyClick.bind(this);
        
        // Inicialización
        this.initKeypad();
        this.initLogout();
        this.createToastContainer();
        
        window.keypad = this;
    }

    /* ========== MÉTODOS PRINCIPALES ========== */

    createToastContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'info', options = {}) {
        if (!this.toastEnabled) return;
        
        const { duration = 3000, showIcon = true } = options;
        
        let content = showIcon 
            ? `<div class="toast-content"><span class="toast-icon"></span>${message}</div>`
            : `<div class="toast-content">${message}</div>`;
        
        Toastify({
            text: content,
            duration: duration,
            close: true,
            gravity: 'top',
            position: 'right',
            className: `toast-${showIcon ? type : 'no-icon'}`,
            escapeMarkup: false,
            stopOnFocus: true,
            style: {
                background: 'transparent',
                boxShadow: 'none',
                padding: '0'
            }
        }).showToast();
    }

    /* ========== CONTROL DEL KEYPAD ========== */

    initKeypad() {
        // Listeners para botones táctiles
        this.keys.forEach(key => {
            if (!key._hasKeypadListener) {
                key.addEventListener('click', this.handleKeyClick);
                key._hasKeypadListener = true;
            }
        });

        // Listener para teclado físico
        if (!document._hasKeypadKeydownListener) {
            document.addEventListener('keydown', this.handlePhysicalKeyPress);
            document._hasKeypadKeydownListener = true;
        }
    }

    disableKeypad() {
        // Eliminar listener de teclado físico
        if (document._hasKeypadKeydownListener) {
            document.removeEventListener('keydown', this.handlePhysicalKeyPress);
            document._hasKeypadKeydownListener = false;
        }

        // Eliminar listeners de botones
        this.keys.forEach(key => {
            if (key._hasKeypadListener) {
                key.removeEventListener('click', this.handleKeyClick);
                key._hasKeypadListener = false;
            }
        });
    }

    enableKeypad() {
        this.initKeypad(); // Reestablece todos los listeners
    }

    /* ========== MANEJO DE EVENTOS ========== */

    handlePhysicalKeyPress(event) {
        if (event.repeat) return;
        
        const key = event.key;
        if (/^[0-9]$/.test(key)) {
            this.handleKeyPress(key);
            this.highlightKey(document.querySelector(`[data-key="${key}"]`));
        } else if (key === 'Enter') {
            this.handleKeyPress('enter');
            this.highlightKey(document.querySelector('[data-key="enter"]'));
        } else if (key === 'Backspace' || key === 'Delete') {
            this.handleKeyPress('clear');
            this.highlightKey(document.querySelector('[data-key="clear"]'));
        }
    }

    handleKeyClick(event) {
        const keyValue = event.currentTarget.getAttribute('data-key');
        this.handleKeyPress(keyValue);
        this.highlightKey(event.currentTarget);
    }

    handleKeyPress(keyValue) {
        if (this.isProcessing) return;

        switch(keyValue) {
            case 'clear':
                this.clearPin();
                break;
            case 'enter':
                this.handleEnter();
                break;
            default:
                this.addDigit(keyValue);
                break;
        }
    }

    /* ========== LÓGICA DEL PIN ========== */

    handleEnter() {
        if (this.currentPin.length === 5) {
            this.isProcessing = true;
            this.verifyPin();
        } else {
            this.showTempMessage("Ingrese 5 dígitos", "error-message");
        }
    }

    verifyPin() {
        const decodedPins = Object.fromEntries(
            Object.entries(this.validPins).map(([encodedPin, userName]) => [
                atob(encodedPin), userName
            ])
        );
        
        const currentPinStr = String(this.currentPin);
        
        if (decodedPins[currentPinStr]) {
            this.successAccess(decodedPins[currentPinStr]);
        } else {
            this.failedAccess();
        }
    }

    /* ========== FLUJOS DE ACCESO ========== */

    successAccess(userName = '') {
        // Guardar el PIN como userId en localStorage
        localStorage.setItem('userId', this.currentPin);

        // Feedback visual
        this.pinDots.forEach(dot => dot.classList.add('valid'));
        this.showTempMessage(`ACCESO CONCEDIDO - ${userName}`, "success-message");
        
        // Actualizar UI
        this.updateUserElements(userName);
        
        // Toast de bienvenida (controlado)
        this.toastEnabled = true;
        this.showToast(
            `${["Kiana"].includes(userName) ? "¡Bienvenida" : "¡Bienvenido"} ${userName}!`, 
            'success', 
            { duration: 3000 }
        );
        this.toastEnabled = false;
        
        // Ocultar keypad
        this.hideKeypad(() => {
            document.dispatchEvent(new CustomEvent('accessGranted', {
                detail: { userName: userName }
            }));
        });
        
        // Desactivar keypad
        this.disableKeypad();
    }

    failedAccess() {
        this.pinDots.forEach(dot => dot.classList.add('invalid'));
        this.showTempMessage("PIN INCORRECTO", "error-message");
        this.showToast('PIN incorrecto. Intente nuevamente.', 'error');
        
        setTimeout(() => this.clearPin(), 1500);
    }

    /* ========== HELPERS ========== */

    showTempMessage(message, className) {
        this.messageDisplay.textContent = message;
        this.messageDisplay.className = className;
        
        if (className.includes('error')) {
            this.isProcessing = true;
            setTimeout(() => {
                this.messageDisplay.textContent = "Ingrese PIN";
                this.messageDisplay.className = "";
                this.isProcessing = false;
            }, 1500);
        }
    }

    updateUserElements(userName) {
        const userNameDiv = document.getElementById('user-name');
        if (userNameDiv) userNameDiv.textContent = `Usuario: ${userName}`;

        const span123 = document.getElementById('123');
        if (span123) span123.textContent = userName;
    }

    hideKeypad(callback) {
        this.keypadOverlay.classList.add('hide');
        if (this.logoContainer) this.logoContainer.classList.add('hide');
        
        setTimeout(() => {
            this.keypadOverlay.style.display = 'none';
            if (this.logoContainer) this.logoContainer.style.display = 'none';
            this.isProcessing = false;
            if (callback) callback();
        }, 1000);
    }

    /* ========== MÉTODOS BÁSICOS ========== */

    addDigit(digit) {
        if (this.currentPin.length < 5) {
            this.currentPin += digit;
            this.updatePinDisplay();
            
            if (this.currentPin.length === 5) {
                this.isProcessing = true;
                setTimeout(() => this.verifyPin(), 300);
            }
        }
    }

    clearPin() {
        this.currentPin = "";
        this.updatePinDisplay();
        this.messageDisplay.textContent = "Ingrese PIN";
        this.messageDisplay.className = "";
        this.isProcessing = false;
    }

    updatePinDisplay() {
        this.pinDots.forEach((dot, index) => {
            dot.classList.remove('active', 'valid', 'invalid');
            if (index < this.currentPin.length) {
                dot.classList.add('active');
            }
        });
    }

    highlightKey(key) {
        if (!key) return;
        key.classList.add('key-pressed');
        setTimeout(() => key.classList.remove('key-pressed'), 200);
    }

    /* ========== LOGOUT ========== */

    initLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn && !logoutBtn._hasLogoutListener) {
            logoutBtn.addEventListener('click', () => {
                // Limpiar el userId al cerrar sesión
                localStorage.removeItem('userId');
                
                this.toastEnabled = true; // Reactivar Toastify
                this.enableKeypad(); // Reactivar keypad
                this.showKeypad();
                this.showToast('Sesión cerrada', 'info');
            });
            logoutBtn._hasLogoutListener = true;
        }
    }

    showKeypad() {
        this.clearPin();
        this.keypadOverlay.style.display = 'block';
        this.keypadOverlay.classList.remove('hide');
        
        if (this.logoContainer) {
            this.logoContainer.style.display = 'block';
            this.logoContainer.classList.remove('hide');
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => new Keypad());