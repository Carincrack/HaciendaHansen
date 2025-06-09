class EmbrioManager {
    constructor() {
        this.embrionesSection = document.getElementById('embriones');
        this.addButton = this.embrionesSection.querySelector('.add-btn-embrion');
        this.formOpen = false;
        this.cows = [];
        this.embryos = [];
        this.photoPrefix = 'animalPhoto_';

        this.init();
    }

    async init() {
        this.addButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (!this.formOpen) {
                this.showForm();
            }
        });
        await this.loadCows();
        await this.loadEmbryos();
    }

    async loadCows() {
        try {
            const response = await fetch('http://localhost:3000/animals');
            if (!response.ok) throw new Error('Error al cargar las vacas');
            this.cows = await response.json();
            console.log('Vacas cargadas:', this.cows);
        } catch (error) {
            console.error('Error al cargar las vacas:', error);
            this.showToast(`Error al cargar las vacas: ${error.message}`, 'error');
        }
    }

    async loadEmbryos() {
        try {
            const response = await fetch('http://localhost:3000/embryo');
            if (!response.ok) throw new Error('Error al cargar los embriones');
            this.embryos = await response.json();
            this.renderEmbryos();
        } catch (error) {
            console.error('Error al cargar los embriones:', error);
            this.showToast(`Error al cargar los embriones: ${error.message}`, 'error');
        }
    }

    showForm(embryo = null) {
        if (this.formOpen) return;
        this.formOpen = true;

        const overlay = document.createElement('div');
        overlay.className = 'form-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000;
        `;

        const form = document.createElement('div');
        form.className = 'embryo-form';
        form.style.cssText = `
            background-color: var(--color-bg-light); padding: 20px; border-radius: var(--border-radius);
            width: 90%; max-width: 500px; max-height: 90vh;
            overflow-y: auto; box-shadow: var(--shadow-soft);
        `;

        const isEditMode = embryo !== null;
        form.innerHTML = `
            <h2 style="margin-top: 0; color: var(--color-text); font-size: 1.8rem; font-weight: 600;">${isEditMode ? 'Editar' : 'Registrar'} Embrión</h2>
            <form id="embryo-form">
                ${isEditMode ? `<input type="hidden" id="embryo-id" value="${embryo.embryoId}">` : ''}
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Receptor:</label>
                    <select id="receptor" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                        <option value="">Seleccione una vaca</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Donadora/Madre:</label>
                    <select id="donorMother" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                        <option value="">Seleccione una vaca</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Donadora/Padre:</label>
                    <select id="donorFather" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                        <option value="">Seleccione una vaca</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Confirmación de Preñez:</label>
                    <select id="pregnancyConfirmation" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                        <option value="50" ${isEditMode ? '' : 'selected'}>50 días</option>
                        <option value="custom">Personalizado</option>
                    </select>
                    <input type="number" id="customCountdown" style="display: ${isEditMode && embryo.pregnancyConfirmation !== '50' ? 'block' : 'none'}; width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);"
                           placeholder="Días personalizados" min="1" value="${isEditMode && embryo.pregnancyConfirmation !== '50' ? embryo.pregnancyConfirmation : ''}">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="button" id="cancel-form" class="btn-cancel" style="padding: 8px 16px; background-color: var(--color-error); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Cancelar</button>
                    <button type="submit" class="btn-save" style="padding: 8px 16px; background-color: var(--color-success); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">${isEditMode ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </form>
        `;

        const pregnancySelect = form.querySelector('#pregnancyConfirmation');
        const customCountdown = form.querySelector('#customCountdown');
        pregnancySelect.addEventListener('change', () => {
            customCountdown.style.display = pregnancySelect.value === 'custom' ? 'block' : 'none';
            customCountdown.required = pregnancySelect.value === 'custom';
        });

        this.populateCowSelect(form.querySelector('#receptor'), embryo?.receptorId);
        this.populateCowSelect(form.querySelector('#donorMother'), embryo?.donorMotherId);
        this.populateCowSelect(form.querySelector('#donorFather'), embryo?.donorFatherId);

        const closeForm = () => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            this.formOpen = false;
        };

        form.querySelector('#cancel-form').addEventListener('click', closeForm);

        form.querySelector('#embryo-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const receptorId = form.querySelector('#receptor').value;
            const donorMotherId = form.querySelector('#donorMother').value;
            const donorFatherId = form.querySelector('#donorFather').value;
            const pregnancyConfirmation = form.querySelector('#pregnancyConfirmation').value;
            const customCountdown = form.querySelector('#customCountdown').value || null;

            const countdownDays = pregnancyConfirmation === 'custom' ? customCountdown : pregnancyConfirmation;

            if (receptorId === "" || donorMotherId === "" || donorFatherId === "" || !countdownDays) {
                this.showToast('Debe seleccionar una vaca para Receptor, Donadora/Madre y Donadora/Padre, y especificar los días de preñez.', 'error');
                return;
            }

            const embryoData = {
                receptorId,
                donorMotherId,
                donorFatherId,
                pregnancyConfirmation: countdownDays,
                timestamp: new Date().toISOString(),
                embryoId: isEditMode ? embryo.embryoId : `E${Date.now()}`,
                confirmed: isEditMode ? embryo.confirmed : false
            };

            try {
                if (isEditMode) {
                    await this.updateEmbryo(embryoData);
                    this.showToast('Embrión actualizado correctamente', 'success');
                } else {
                    await this.saveEmbryo(embryoData);
                    this.showToast('Embrión registrado correctamente', 'success');
                }
                closeForm();
                await this.loadEmbryos();
            } catch (error) {
                this.showToast(`Error al guardar el embrión: ${error.message}`, 'error');
            }
        });

        const existingOverlay = document.querySelector('.form-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        overlay.appendChild(form);
        document.body.appendChild(overlay);
    }

    populateCowSelect(select, selectedId = null) {
        this.cows.forEach(cow => {
            const option = document.createElement('option');
            option.value = cow.id;
            option.textContent = cow.name;
            if (selectedId && cow.id === selectedId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    async saveEmbryo(embryoData) {
        try {
            const response = await fetch('http://localhost:3000/embryo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embryoData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al guardar el embrión: ${errorText || 'Sin mensaje del servidor'}`);
            }
            const result = await response.json();
            console.log('Respuesta del servidor:', result);
        } catch (error) {
            throw error;
        }
    }

    async updateEmbryo(embryoData) {
        try {
            const response = await fetch(`http://localhost:3000/embryo/${embryoData.embryoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embryoData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al actualizar el embrión: ${errorText || 'Sin mensaje del servidor'}`);
            }
            const result = await response.json();
            console.log('Respuesta del servidor:', result);
        } catch (error) {
            throw error;
        }
    }

    async deleteEmbryo(embryoId) {
        if (await this.showConfirmation('¿Estás seguro de eliminar este embrión?')) {
            try {
                const response = await fetch(`http://localhost:3000/embryo/${embryoId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al eliminar el embrión: ${errorText || 'Sin mensaje del servidor'}`);
                }
                const result = await response.json();
                console.log('Respuesta del servidor:', result);
                await this.loadEmbryos();
                this.showToast('Embrión eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error completo:', error);
                this.showToast(`Error al eliminar el embrión: ${error.message}`, 'error');
            }
        }
    }

    renderEmbryos() {
        const embryoList = this.embrionesSection.querySelector('.embryo-list') || document.createElement('div');
        if (!embryoList.classList.contains('embryo-list')) {
            embryoList.className = 'embryo-list';
            this.embrionesSection.appendChild(embryoList);
        }
        embryoList.innerHTML = '';

        if (this.embryos.length === 0) {
            embryoList.innerHTML = '<p>No hay embriones registrados.</p>';
            return;
        }

        this.embryos.forEach(embryo => {
            const receptorCow = this.cows.find(c => c.id === embryo.receptorId);
            const donorMotherCow = this.cows.find(c => c.id === embryo.donorMotherId);
            const donorFatherCow = this.cows.find(c => c.id === embryo.donorFatherId);

            const cowNames = {
                receptor: receptorCow ? receptorCow.name : 'Desconocido',
                donorMother: donorMotherCow ? donorMotherCow.name : 'Desconocido',
                donorFather: donorFatherCow ? donorFatherCow.name : 'Desconocido'
            };

            const embryoCard = document.createElement('div');
            embryoCard.className = 'animal-card';
            embryoCard.style.cssText = `
                ${embryo.confirmed ? 'background-color: rgba(135, 206, 235, 0.5);' : embryo.confirmed === false ? 'background-color: rgba(255, 105, 97, 0.5);' : ''}
            `;
            embryoCard.innerHTML = `
                <h3>Embrión ${embryo.embryoId}</h3>
                <p><strong>Receptor:</strong> ${cowNames.receptor}</p>
                <p><strong>Donadora/Madre:</strong> ${cowNames.donorMother}</p>
                <p><strong>Donadora/Padre:</strong> ${cowNames.donorFather}</p>
                <p><strong>Confirmación de Preñez:</strong> ${embryo.pregnancyConfirmation} días</p>
                <div id="countdown-${embryo.embryoId}" class="countdown">${embryo.confirmed ? 'Estado de Gestación: Calculando...' : embryo.confirmed === false ? '' : `Cuenta regresiva: ${embryo.pregnancyConfirmation}d`}</div>
                <div class="vaccine-actions">
                    <button class="btn-confirm-embryo" data-id="${embryo.embryoId}">Confirmar</button>
                    <button class="btn-edit-embryo" data-id="${embryo.embryoId}">Editar</button>
                    <button class="btn-delete-embryo" data-id="${embryo.embryoId}">Eliminar</button>
                    <button class="btn-info-embryo" data-id="${embryo.embryoId}">Ver Info</button>
                </div>
            `;

            embryoList.appendChild(embryoCard);

            if (embryo.confirmed) {
                this.startCountdown(embryo.embryoId, 220, embryo.timestamp); // 9 meses (270 días) - 50 días
            } else if (embryo.confirmed === false) {
                // No iniciar cuenta regresiva si no confirmado
            } else {
                this.startCountdown(embryo.embryoId, embryo.pregnancyConfirmation, embryo.timestamp);
            }

            document.querySelectorAll('.btn-confirm-embryo').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.confirmEmbryo(e.target.dataset.id);
                });
            });
        });

        document.querySelectorAll('.btn-edit-embryo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editEmbryo(e.target.dataset.id);
            });
        });
        document.querySelectorAll('.btn-delete-embryo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteEmbryo(e.target.dataset.id);
            });
        });
        document.querySelectorAll('.btn-info-embryo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showInfo(e.target.dataset.id);
            });
        });
    }

    startCountdown(embryoId, days, startTimestamp) {
        const countdownElement = document.getElementById(`countdown-${embryoId}`);
        const startDate = new Date(startTimestamp).getTime();
        const targetDate = startDate + (parseInt(days) * 24 * 60 * 60 * 1000);

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                countdownElement.textContent = 'Cuenta regresiva terminada';
                return;
            }

            const daysLeft = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownElement.textContent = `faltan ${daysLeft}d ${hours}h ${minutes}m ${seconds}s`;
            setTimeout(updateCountdown, 1000);
        };

        updateCountdown();
    }

    async confirmEmbryo(embryoId) {
        const embryo = this.embryos.find(e => e.embryoId === embryoId);
        if (!embryo) return;

        const result = await this.showConfirmation('¿Confirmar embarazo?');
        if (result) {
            embryo.confirmed = true;
            await this.updateEmbryo(embryo);
            this.showToast('Embarazo confirmado', 'success');
        } else if (result !== undefined) { // Solo actualizar si se seleccionó Sí o No
            embryo.confirmed = false;
            await this.updateEmbryo(embryo);
            this.showToast('Embarazo no confirmado', 'info');
        }
        await this.loadEmbryos();
    }

    editEmbryo(embryoId) {
        const embryo = this.embryos.find(e => e.embryoId === embryoId);
        if (embryo) this.showForm(embryo);
    }

    showInfo(embryoId) {
        const embryo = this.embryos.find(e => e.embryoId === embryoId);
        if (embryo) {
            const receptorCow = this.cows.find(c => c.id === embryo.receptorId) || { name: 'Desconocido', registryId: '' };
            const donorMotherCow = this.cows.find(c => c.id === embryo.donorMotherId) || { name: 'Desconocido', registryId: '' };
            const donorFatherCow = this.cows.find(c => c.id === embryo.donorFatherId) || { name: 'Desconocido', registryId: '' };

            const extensionsToTry = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
            const basePhotoPath = 'http://localhost:3000/Proyecto_Hacienda_HXX/animal-data';
            const getPhotoUrl = async (cow) => {
                if (!cow.registryId) return '/images/placeholder.jpg';

                const storedPhoto = localStorage.getItem(`${this.photoPrefix}${cow.registryId}`);
                if (storedPhoto) {
                    const testImage = new Image();
                    testImage.src = storedPhoto;
                    const loaded = await new Promise(resolve => {
                        testImage.onload = () => resolve(true);
                        testImage.onerror = () => resolve(false);
                    });
                    if (loaded) return storedPhoto;
                }

                const nameEncoded = encodeURIComponent(cow.name);
                const cleanRegistryId = encodeURIComponent(cow.registryId.replace('/', '_'));
                for (const ext of extensionsToTry) {
                    const url = `${basePhotoPath}/${nameEncoded}/perfil/${cleanRegistryId}.${ext}`;
                    const testImage = new Image();
                    testImage.src = url;
                    const loaded = await new Promise(resolve => {
                        testImage.onload = () => resolve(true);
                        testImage.onerror = () => resolve(false);
                    });
                    if (loaded) {
                        localStorage.setItem(`${this.photoPrefix}${cow.registryId}`, url);
                        return url;
                    }
                }
                return '/images/placeholder.jpg';
            };

            const loadPhotosAndShowModal = async () => {
                const receptorPhoto = await getPhotoUrl(receptorCow);
                const donorMotherPhoto = await getPhotoUrl(donorMotherCow);
                const donorFatherPhoto = await getPhotoUrl(donorFatherCow);

                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0,0,0,0.7);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 1000;
                `;

                const modalContent = document.createElement('div');
                modalContent.className = 'modal-content';
                modalContent.style.cssText = `
                    background-color: var(--color-bg-light); padding: 20px; border-radius: var(--border-radius);
                    width: 90%; max-width: 500px; box-shadow: var(--shadow-soft);
                    text-align: center; color: var(--color-text);
                `;

                modalContent.innerHTML = `
                    <h3 style="margin-top: 0; color: var(--color-text); font-size: 1.8rem; font-weight: 600;">Detalles del Embrión ${embryo.embryoId}</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                        <tr style="background-color: var(--color-bg-medium);">
                            <th style="padding: 8px; border: 1px solid var(--color-border);">Campo</th>
                            <th style="padding: 8px; border: 1px solid var(--color-border);">Información</th>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">Receptor:</td>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">${receptorCow.registryId ? `<img src="${receptorPhoto}" alt="${receptorCow.name}" class="animal-photo" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : ''} ${receptorCow.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">Donadora/Madre:</td>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">${donorMotherCow.registryId ? `<img src="${donorMotherPhoto}" alt="${donorMotherCow.name}" class="animal-photo" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : ''} ${donorMotherCow.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">Donadora/Padre:</td>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">${donorFatherCow.registryId ? `<img src="${donorFatherPhoto}" alt="${donorFatherCow.name}" class="animal-photo" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : ''} ${donorFatherCow.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">Confirmación de Preñez:</td>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">${embryo.pregnancyConfirmation} días</td>
                        </tr>
                    </table>
                    <div class="button-container">
                        <button class="btn-cancel" style="padding: 8px 16px; background-color: var(--color-error); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Cerrar</button>
                    </div>
                `;

                overlay.appendChild(modalContent);
                document.body.appendChild(overlay);

                modalContent.querySelector('.btn-cancel').addEventListener('click', () => {
                    if (overlay && document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                });
            };

            loadPhotosAndShowModal();
        }
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
            style: { 
                background: 'transparent', 
                boxShadow: 'none', 
                padding: '0',
                zIndex: 1001 // Aseguramos que el toast esté por encima del formulario
            }
        }).showToast();
    }

    async showConfirmation(message) {
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
                position: relative;
            `;

            modal.innerHTML = `
                <span class="close-modal" style="position: absolute; top: 10px; right: 10px; cursor: pointer; font-size: 1.5rem; color: var(--color-text);">×</span>
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
                // No resolver la promesa al cerrar con la X
            };

            modal.querySelector('.close-modal').addEventListener('click', closeModal);
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
}

document.addEventListener('DOMContentLoaded', () => new EmbrioManager());