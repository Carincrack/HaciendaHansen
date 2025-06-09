const socket = io('http://localhost:3000'); // Conexión al servidor principal en 3000

const entradasContainer = document.getElementById('entradas-facturas');
const salidasContainer = document.getElementById('salidas-facturas');
const resultadoFinanzas = document.querySelector('.resul-finces');

let entradas = [];
let salidas = [];
let formOpen = false;
let currentTimestamp = null;
let currentType = null;

class FinanzasManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        socket.on('connect', () => {
            console.log('Conectado al servidor de finanzas');
            socket.emit('requestFinanzasData');
        });

        socket.on('finanzasData', (data) => {
            console.log('Datos recibidos:', data);
            entradas = data.entradas || [];
            salidas = data.salidas || [];
            this.renderFinanzas();
            this.actualizarResultado();
        });

        socket.on('disconnect', () => {
            console.log('Desconectado del servidor de finanzas');
        });

        document.querySelectorAll('.add-btn').forEach(button => {
            button.addEventListener('click', () => {
                const tipo = button.textContent.includes('+') ? 'ingreso' : 'salida';
                this.showForm(tipo);
            });
        });
    }

    renderFinanzas() {
        entradasContainer.innerHTML = '';
        salidasContainer.innerHTML = '';

        entradas.forEach(item => {
            const factura = document.createElement('div');
            factura.className = 'factura';
            factura.innerHTML = `
                <strong>Entrada:</strong> ${item.descripcion} - ₡${item.monto} - ${new Date(item.timestamp).toLocaleString()}
                <div class="actions">
                    <button class="detail-btn" onclick="finanzasManager.showDetails('${item.timestamp}')">Detalles</button>
                    <button class="edit-btn" onclick="finanzasManager.editItem('${item.timestamp}', 'ingreso')">Editar</button>
                    <button class="delete-btn" onclick="finanzasManager.showDeleteConfirm('${item.timestamp}', 'ingreso')">Eliminar</button>
                </div>
            `;
            entradasContainer.appendChild(factura);
        });

        salidas.forEach(item => {
            const factura = document.createElement('div');
            factura.className = 'factura';
            factura.innerHTML = `
                <strong>Salida:</strong> ${item.descripcion} - ₡${item.monto} - ${new Date(item.timestamp).toLocaleString()}
                <div class="actions">
                    <button class="detail-btn" onclick="finanzasManager.showDetails('${item.timestamp}')">Detalles</button>
                    <button class="edit-btn" onclick="finanzasManager.editItem('${item.timestamp}', 'salida')">Editar</button>
                    <button class="delete-btn" onclick="finanzasManager.showDeleteConfirm('${item.timestamp}', 'salida')">Eliminar</button>
                </div>
            `;
            salidasContainer.appendChild(factura);
        });
    }

    actualizarResultado() {
        const totalEntradas = entradas.reduce((sum, item) => sum + (item.monto || 0), 0);
        const totalSalidas = salidas.reduce((sum, item) => sum + (item.monto || 0), 0);
        const resultado = totalEntradas - totalSalidas;
        resultadoFinanzas.value = `₡${this.formatCurrency(resultado)}`;
    }

    // Función para formatear moneda en estilo costarricense (CRC)
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    showForm(tipo, itemToEdit = null) {
        if (formOpen) return;
        formOpen = true;

        const overlay = document.createElement('div');
        overlay.className = 'form-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000;
        `;

        const form = document.createElement('div');
        form.className = 'finanzas-form';
        form.style.cssText = `
            background-color: var(--color-bg-light); padding: 20px; border-radius: var(--border-radius);
            width: 90%; max-width: 500px; max-height: 90vh;
            overflow-y: auto; box-shadow: var(--shadow-soft);
        `;

        const isEditMode = itemToEdit !== null;

        form.innerHTML = `
            <h2 style="margin-top: 0; color: var(--color-text); font-size: 1.8rem; font-weight: 600;">${isEditMode ? 'Editar' : 'Agregar'} ${tipo}</h2>
            <form id="finanzasForm">
                ${isEditMode ? `<input type="hidden" id="finanzas-id" value="${itemToEdit.timestamp}">` : ''}
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Descripción:</label>
                    <input type="text" id="finanzas-descripcion" value="${isEditMode ? itemToEdit.descripcion : ''}" required
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Monto:</label>
                    <input type="number" id="finanzas-monto" value="${isEditMode ? itemToEdit.monto : ''}" step="0.01" min="0" required
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="button" id="reset-form" class="btn-reset" style="padding: 8px 16px; background-color: var(--color-primary); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Limpiar</button>
                    <button type="button" id="cancel-form" class="btn-cancel" style="padding: 8px 16px; background-color: var(--color-error); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Cancelar</button>
                    <button type="submit" class="btn-save" style="padding: 8px 16px; background-color: var(--color-success); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">${isEditMode ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </form>
        `;

        const closeForm = () => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            formOpen = false;
        };

        form.querySelector('#reset-form').addEventListener('click', () => {
            form.querySelector('#finanzasForm').reset();
        });

        form.querySelector('#cancel-form').addEventListener('click', closeForm);

        form.querySelector('#finanzasForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const descripcion = document.getElementById('finanzas-descripcion').value;
            const monto = document.getElementById('finanzas-monto').value;

            if (descripcion && monto) {
                const timestamp = isEditMode ? itemToEdit.timestamp : new Date().toISOString();
                const data = { descripcion, monto: parseFloat(monto), timestamp };

                if (isEditMode) {
                    if (currentType === 'ingreso') {
                        entradas = entradas.map(i => i.timestamp === timestamp ? data : i);
                        socket.emit('addIngreso', data);
                    } else {
                        salidas = salidas.map(i => i.timestamp === timestamp ? data : i);
                        socket.emit('addSalida', data);
                    }
                    this.showToast(`${tipo} actualizado exitosamente.`, 'success');
                } else {
                    if (tipo === 'ingreso') {
                        socket.emit('addIngreso', data);
                        this.showToast('Entrada agregada exitosamente.', 'success');
                    } else {
                        socket.emit('addSalida', data);
                        this.showToast('Salida agregada exitosamente.', 'success');
                    }
                }
                this.renderFinanzas();
                this.actualizarResultado();
                closeForm();
            } else {
                this.showToast('Por favor, completa todos los campos.', 'error');
            }
        });

        const existingOverlay = document.querySelector('.form-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        overlay.appendChild(form);
        document.body.appendChild(overlay);
    }

    async showDeleteConfirm(timestamp, type) {
        currentTimestamp = timestamp;
        currentType = type;
        const confirmed = await this.showConfirmation('¿Estás seguro de eliminar este registro?');
        if (confirmed) {
            if (currentType === 'ingreso') {
                entradas = entradas.filter(i => i.timestamp !== currentTimestamp);
                socket.emit('deleteIngreso', currentTimestamp);
            } else {
                salidas = salidas.filter(i => i.timestamp !== currentTimestamp);
                socket.emit('deleteSalida', currentTimestamp);
            }
            this.renderFinanzas();
            this.actualizarResultado();
            this.showToast('Registro eliminado exitosamente.', 'success');
        }
    }

    showDetails(timestamp) {
        const item = [...entradas, ...salidas].find(i => i.timestamp === timestamp);
        if (!item) return;

        const overlay = document.createElement('div');
        overlay.className = 'detail-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000;
        `;

        const modal = document.createElement('div');
        modal.className = 'detail-modal';
        modal.style.cssText = `
            background-color: var(--color-bg-light); padding: var(--spacing-xl); border-radius: var(--border-radius);
            width: 90%; max-width: 500px; max-height: 90vh;
            overflow-y: auto; box-shadow: var(--shadow-soft);
            text-align: left; color: var(--color-text);
        `;

        modal.innerHTML = `
            <h2 style="margin: 0 0 var(--spacing-lg) 0; font-size: var(--font-size-xl); font-weight: 600; color: var(--color-text); text-align: center; border-bottom: var(--border-width) solid var(--color-border); padding-bottom: var(--spacing-md);">Detalles</h2>
            <div class="detail-content">
                <p><strong>Descripción:</strong> ${item.descripcion}</p>
                <p><strong>Monto:</strong> ₡${item.monto.toFixed(2)}</p>
                <p><strong>Fecha:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
            </div>
            <div class="form-actions" style="display: flex; justify-content: center; gap: var(--spacing-sm); margin-top: var(--spacing-lg);">
                <button class="btn-cancel" style="padding: var(--spacing-sm) var(--spacing-md); border: var(--border-width) solid var(--color-error); background: transparent; color: var(--color-error); border-radius: var(--border-radius-sm); font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: all var(--transition-quick);">Cerrar</button>
            </div>
        `;

        const closeModal = () => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        };

        modal.querySelector('.btn-cancel').addEventListener('click', closeModal);

        const existingOverlay = document.querySelector('.detail-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    editItem(timestamp, type) {
        const item = type === 'ingreso' ? entradas.find(i => i.timestamp === timestamp) : salidas.find(i => i.timestamp === timestamp);
        if (item) {
            this.showForm(type === 'ingreso' ? 'ingreso' : 'salida', item);
        }
    }

    showConfirmation(message) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'confirmation-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0,0,0,0.7);
                display: flex; justify-content: center; align-items: center;
                z-index: 1000;
            `;

            const modal = document.createElement('div');
            modal.className = 'confirmation-modal';
            modal.style.cssText = `
                background-color: var(--color-bg-light); padding: 20px; border-radius: var(--border-radius);
                width: 90%; max-width: 400px; box-shadow: var(--shadow-soft);
                text-align: center; color: var(--color-text);
            `;

            modal.innerHTML = `
                <p style="font-size: 1.2rem; font-weight: 500; margin-bottom: 20px;">${message}</p>
                <div style="display: flex; justify-content: center; gap: 10px;">
                    <button class="btn-confirm-yes" style="padding: 8px 16px; background-color: var(--color-success); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Sí</button>
                    <button class="btn-confirm-no" style="padding: 8px 16px; background-color: var(--color-error); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">No</button>
                </div>
            `;

            const closeModal = () => {
                if (overlay && document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            };

            modal.querySelector('.btn-confirm-yes').addEventListener('click', () => {
                resolve(true);
                closeModal();
            });

            modal.querySelector('.btn-confirm-no').addEventListener('click', () => {
                resolve(false);
                closeModal();
            });

            document.body.appendChild(overlay);
            overlay.appendChild(modal);
        });
    }

    showToast(message, type = 'info', options = {}) {
        const { duration = 3000, showIcon = true } = options;
        let content = showIcon ? `<div class="toast-content"><span class="toast-icon"></span>${message}</div>` : `<div class="toast-content">${message}</div>`;
        if (!showIcon) type = 'no-icon';

        Toastify({
            text: content,
            duration: duration,
            close: true,
            gravity: 'top',
            position: 'right',
            className: `toast-${type}`,
            escapeMarkup: false,
            stopOnFocus: true,
            style: { background: 'transparent', boxShadow: 'none', padding: '0' }
        }).showToast();
    }
}

const finanzasManager = new FinanzasManager();
window.finanzasManager = finanzasManager;