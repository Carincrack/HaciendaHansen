class Keypad {
    constructor() {
        // Lista de PINs válidos con sus usuarios correspondientes (encriptados en Base64)
        this.validPins = Object.freeze({
            "NTgzNjA=": "Scott",
            "NTA0NjA=": "Kevin", 
            "OTk5OTk=": "Kiana",

        });
        
        this.currentPin = "";
        this.isProcessing = false;
        this.pinDots = document.querySelectorAll('.pin-dot');
        this.messageDisplay = document.getElementById('message-display');
        this.keypadOverlay = document.getElementById('keypad-overlay');
        this.keys = document.querySelectorAll('.key');
        this.logoContainer = document.querySelector('.logo-container');
        
        this.initKeypad();
        this.initLogout();
        this.createToastContainer();
        
        window.keypad = this;
    }

    // Crear contenedor para toasts
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

    // Función toast integrada
showToast(message, type = 'info', options = {}) {
    const { duration = 3000, showIcon = true } = options;
    
    // Preparar el contenido
    let content;
    if (showIcon) {
        content = `<div class="toast-content"><span class="toast-icon"></span>${message}</div>`;
    } else {
        content = `<div class="toast-content">${message}</div>`;
        type = 'no-icon';
    }
    
    Toastify({
        text: content,
        duration: duration,
        close: true,
        gravity: 'top',
        position: 'right',
        className: `toast-${type}`,
        escapeMarkup: false,
        stopOnFocus: true,
        style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: '0'
        }
    }).showToast();
}

initKeypad() {
    console.log('initKeypad called'); // Verifica en la consola cuántas veces aparece esto
    
    // Configurar oyentes de teclas
    this.keys.forEach(key => {
        // Verifica si ya hay un listener
        if (!key._hasKeypadListener) {
            key.addEventListener('click', () => {
                const keyValue = key.getAttribute('data-key');
                this.handleKeyPress(keyValue);
                this.highlightKey(key);
            });
            key._hasKeypadListener = true; // Marcar que ya tiene un listener
        }
    });

    // Soporte para teclado físico
    if (!document._hasKeypadKeydownListener) {
        document.addEventListener('keydown', (event) => {
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
        });
        document._hasKeypadKeydownListener = true; // Marcar que ya tiene un listener
    }
}
    initLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.showKeypad();
                this.showToast('Sesión cerrada', 'info');
            });
        }
    }

    highlightKey(key) {
        if (!key) return;
        key.classList.add('key-pressed');
        setTimeout(() => {
            key.classList.remove('key-pressed');
        }, 200);
    }

    handleKeyPress(keyValue) {
        if (this.isProcessing) return;

        switch(keyValue) {
            case 'clear':
                this.clearPin();
                break;
            case 'enter':
                if (this.currentPin.length === 5) {
                    this.isProcessing = true;
                    this.verifyPin();
                } else {
                    this.isProcessing = true;
                    this.messageDisplay.textContent = "Ingrese 5 dígitos";
                    this.messageDisplay.className = "error-message";
                    setTimeout(() => {
                        this.messageDisplay.textContent = "Ingrese PIN";
                        this.messageDisplay.className = "";
                        this.isProcessing = false;
                    }, 1500);
                }
                break;
            default:
                this.addDigit(keyValue);
                break;
        }
    }

    clearPin() {
        this.currentPin = "";
        this.updatePinDisplay();
        this.messageDisplay.textContent = "Ingrese PIN";
        this.messageDisplay.className = "";
        this.isProcessing = false;
    }

    addDigit(digit) {
        if (this.currentPin.length < 5) {
            this.currentPin += digit;
            this.updatePinDisplay();
            
            if (this.currentPin.length === 5) {
                this.isProcessing = true;
                setTimeout(() => {
                    this.verifyPin();
                }, 300);
            }
        }
    }

    updatePinDisplay() {
        this.pinDots.forEach((dot, index) => {
            dot.classList.remove('active', 'valid', 'invalid');
            if (index < this.currentPin.length) {
                dot.classList.add('active');
            }
        });
    }

    verifyPin() {
        const currentPinStr = String(this.currentPin);
        const decodedPins = Object.fromEntries(
            Object.entries(this.validPins).map(([encodedPin, userName]) => [
                atob(encodedPin), userName
            ])
        );
        
        const pinExists = Object.keys(decodedPins).includes(currentPinStr);
        
        if (pinExists) {
            const userName = decodedPins[currentPinStr];
            this.successAccess(userName);
        } else {
            this.failedAccess();
        }
    }

    successAccess(userName = '') {
        this.pinDots.forEach(dot => dot.classList.add('valid'));
        this.messageDisplay.textContent = "ACCESO CONCEDIDO" + (userName ? ` - ${userName}` : '');
        this.messageDisplay.className = "success-message";
        
        // Actualizar elementos del DOM con el usuario
        const userNameDiv = document.getElementById('user-name');
        if (userNameDiv) {
            userNameDiv.textContent = `Usuario: ${userName}`;
        }
        
        const span123 = document.getElementById('123');
        if (span123) {
            span123.textContent = userName;
        }
        
        // Mostrar toast de bienvenida
        this.showToast(`¡Bienvenido ${userName}!`, 'success', 4000);
        
        const accessEvent = new CustomEvent('accessGranted', {
            detail: { userName: userName }
        });
        
        setTimeout(() => {
            this.keypadOverlay.classList.add('hide');
            if (this.logoContainer) {
                this.logoContainer.classList.add('hide');
            }
            
            setTimeout(() => {
                this.keypadOverlay.style.display = 'none';
                if (this.logoContainer) {
                    this.logoContainer.style.display = 'none';
                }
                document.dispatchEvent(accessEvent);
                this.isProcessing = false;
            }, 100);
        }, 1000);
    }

    failedAccess() {
        this.pinDots.forEach(dot => dot.classList.add('invalid'));
        this.messageDisplay.textContent = "PIN INCORRECTO";
        this.messageDisplay.className = "error-message";
        
        // Mostrar toast de error
        this.showToast('PIN incorrecto. Intente nuevamente.', 'error');
        
        setTimeout(() => {
            this.clearPin();
        }, 1500);
    }

    showKeypad() {
        this.clearPin();
        this.isProcessing = false;
        this.keypadOverlay.style.display = 'block';
        this.keypadOverlay.classList.remove('hide');
        
        if (this.logoContainer) {
            this.logoContainer.style.display = 'block';
            this.logoContainer.classList.remove('hide');
        }
        
        this.messageDisplay.textContent = "Ingrese PIN";
        this.messageDisplay.className = "";
    }
}

// Inicializar Keypad cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Keypad();
});