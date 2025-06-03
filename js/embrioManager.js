class EmbrioManager {
    constructor() {
        this.embrionesSection = document.getElementById('embriones');
        this.addButton = this.embrionesSection.querySelector('.add-btn-embrion');
        this.formOpen = false;
        this.cows = [];
        this.embryos = [];
        this.photoPrefix = 'animalPhoto_'; // Igual que en AnimalManager

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
            if (!this.cows.some(cow => cow.name === 'ppp')) {
                this.cows.push({ id: 'ppp1', name: 'ppp', registryId: 'ppp1' });
            }
            if (!this.cows.some(cow => cow.name === 'Farid')) {
                this.cows.push({ id: 'farid1', name: 'Farid', registryId: 'farid1' });
            }
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
                        <option value="50" ${isEditMode && embryo.pregnancyConfirmation === '50' ? 'selected' : ''}>50 días</option>
                        <option value="custom" ${isEditMode && embryo.pregnancyConfirmation !== '50' ? 'selected' : ''}>Personalizado</option>
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

            if (!receptorId || !donorMotherId || !donorFatherId || !countdownDays) {
                this.showToast('Por favor, complete todos los campos obligatorios.', 'error');
                return;
            }

            const embryoData = {
                receptorId,
                donorMotherId,
                donorFatherId,
                pregnancyConfirmation: countdownDays,
                timestamp: new Date().toISOString(),
                embryoId: isEditMode ? embryo.embryoId : `E${Date.now()}`
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

        this.embryos.forEach(embryo => {
            const cowNames = {
                receptor: 'ppp',
                donorMother: 'Farid',
                donorFather: 'ppp'
            };

            const embryoCard = document.createElement('div');
            embryoCard.className = 'animal-card';
            embryoCard.innerHTML = `
                <h3>Embrión ${embryo.embryoId}</h3>
                <p><strong>Receptor:</strong> ${cowNames.receptor}</p>
                <p><strong>Donadora/Madre:</strong> ${cowNames.donorMother}</p>
                <p><strong>Donadora/Padre:</strong> ${cowNames.donorFather}</p>
                <p><strong>Confirmación de Preñez:</strong> ${embryo.pregnancyConfirmation} días</p>
                <div id="countdown-${embryo.embryoId}" class="countdown">Cuenta regresiva: Calculando...</div>
                <div class="vaccine-actions">
                    <button class="btn-edit-embryo" data-id="${embryo.embryoId}">Editar</button>
                    <button class="btn-delete-embryo" data-id="${embryo.embryoId}">Eliminar</button>
                    <button class="btn-info-embryo" data-id="${embryo.embryoId}">Ver Info</button>
                </div>
            `;

            embryoList.appendChild(embryoCard);

            this.startCountdown(embryo.embryoId, embryo.pregnancyConfirmation);
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

    startCountdown(embryoId, days) {
        const countdownElement = document.getElementById(`countdown-${embryoId}`);
        const targetDate = new Date().getTime() + (parseInt(days) * 24 * 60 * 60 * 1000);

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

            countdownElement.textContent = `Cuenta regresiva: ${daysLeft}d ${hours}h ${minutes}m ${seconds}s`;
            setTimeout(updateCountdown, 1000);
        };

        updateCountdown();
    }

    editEmbryo(embryoId) {
        const embryo = this.embryos.find(e => e.embryoId === embryoId);
        if (embryo) this.showForm(embryo);
    }

    showInfo(embryoId) {
        const embryo = this.embryos.find(e => e.embryoId === embryoId);
        if (embryo) {
            // Obtener las vacas con sus registryId
            const receptorCow = this.cows.find(c => c.id === embryo.receptorId) || { name: 'ppp', registryId: 'ppp1' };
            const donorMotherCow = this.cows.find(c => c.id === embryo.donorMotherId) || { name: 'Farid', registryId: 'farid1' };
            const donorFatherCow = this.cows.find(c => c.id === embryo.donorFatherId) || { name: 'ppp', registryId: 'ppp1' };

            const extensionsToTry = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
            const basePhotoPath = 'http://localhost:3000/Proyecto_Hacienda_HXX/animal-data';
            const getPhotoUrl = async (cow) => {
                // Primero intentar obtener la foto desde localStorage como en AnimalManager
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
                // Si no hay foto en localStorage, construir la URL manualmente
                if (!cow.registryId) return '/images/placeholder.jpg';
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
                        // Guardar en localStorage para futuras referencias
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
                            <td style="padding: 8px; border: 1px solid var(--color-border);"><img src="${receptorPhoto}" alt="${receptorCow.name}" class="animal-photo" style="max-width: 100px; max-height: 100px; border-radius: 4px;"> ${receptorCow.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">Donadora/Madre:</td>
                            <td style="padding: 8px; border: 1px solid var(--color-border);"><img src="${donorMotherPhoto}" alt="${donorMotherCow.name}" class="animal-photo" style="max-width: 100px; max-height: 100px; border-radius: 4px;"> ${donorMotherCow.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid var(--color-border);">Donadora/Padre:</td>
                            <td style="padding: 8px; border: 1px solid var(--color-border);"><img src="${donorFatherPhoto}" alt="${donorFatherCow.name}" class="animal-photo" style="max-width: 100px; max-height: 100px; border-radius: 4px;"> ${donorFatherCow.name}</td>
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
            style: { background: 'transparent', boxShadow: 'none', padding: '0' }
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
}

document.addEventListener('DOMContentLoaded', () => new EmbrioManager());