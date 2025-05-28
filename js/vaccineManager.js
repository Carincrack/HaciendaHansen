
class VaccineManager {
    constructor(dataManager, dashboardManager, reportManager) {
        this.dataManager = dataManager;
        this.dashboardManager = dashboardManager;
        this.reportManager = reportManager;
        this.formOpen = false;
        this.initializeEvents();
    }

    // Método para inicializar eventos
    initializeEvents() {
        const newVaccineBtn = document.querySelector('.add-btn:not(.btn-delete)');
        if (newVaccineBtn) {
            newVaccineBtn.addEventListener('click', () => this.showVaccineForm());
        } else {
            console.error('Botón "+ Nueva Vacuna" no encontrado en el HTML.');
        }

        const deleteAllBtn = document.querySelector('.add-btn.btn-delete');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => this.deleteAllVaccines());
        } else {
            console.error('Botón "Eliminar Todas las Vacunas" no encontrado en el HTML.');
        }
    }

    // Método para renderizar la lista de vacunas
    renderVaccines() {
        const vaccineList = document.querySelector('.vaccine-list');
        if (!vaccineList) return;

        const vaccines = this.dataManager.getVaccines();
        const animals = this.dataManager.getAnimals();

        vaccineList.innerHTML = '';

        vaccines.forEach(vaccine => {
            const animal = animals.find(a => a.id === vaccine.animalId);
            const vaccineCard = document.createElement('div');
            vaccineCard.classList.add('vaccine-card');

            vaccineCard.innerHTML = `
                <h3>Vacuna: ${vaccine.name}</h3>
                <p>Animal: ${animal ? animal.name : 'Desconocido'} (${animal ? animal.registryId : 'N/A'})</p>
                <p>Fecha de Aplicación: ${vaccine.applicationDate}</p>
                <p>Próxima Dosis: ${vaccine.nextDoseDate || 'No especificada'}</p>
                <p>Notas: ${vaccine.notes || 'Ninguna'}</p>
                <div class="vaccine-actions">
                    <button class="btn-edit" data-id="${vaccine.id}">Editar</button>
                    <button class="btn-delete" data-id="${vaccine.id}">Eliminar</button>
                </div>
            `;

            vaccineList.appendChild(vaccineCard);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.editVaccine(e.target.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteVaccine(e.target.dataset.id));
        });
    }

    // Método para mostrar el formulario de registro de vacunas
    showVaccineForm(vaccineToEdit = null, animalsToEdit = [], originalFileNames = []) {
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
        form.className = 'vaccine-form';
        form.style.cssText = `
            background-color: var(--color-bg-light); padding: 20px; border-radius: var(--border-radius);
            width: 90%; max-width: 500px; max-height: 90vh;
            overflow-y: auto; box-shadow: var(--shadow-soft);
        `;

        const isEditMode = vaccineToEdit !== null;
        const animals = this.dataManager.getAnimals();

        if (animals.length === 0) {
            this.formOpen = false;
            return;
        }

        const predefinedVaccines = {
            'Ivermectina al 1%': 30,
            'Ivermectina al 3.15%': 122,
            'Vitamina (Opcional)': 30,
            'Fumigación (Opcional)': 30,
            'EFFIPRO en Lomo de bovinos (Opcional)': 30
        };

        const currentDate = new Date('2025-05-24T18:47:00-05:00');
        const formattedCurrentDate = currentDate.toISOString().split('T')[0];

        const getDefaultNextDose = (vaccineName, applicationDate) => {
            const days = predefinedVaccines[vaccineName] || 0;
            if (days > 0 && applicationDate) {
                const date = new Date(applicationDate);
                date.setDate(date.getDate() + days);
                return date.toISOString().split('T')[0];
            }
            return '';
        };

        form.innerHTML = `
            <h2 style="margin-top: 0; color: var(--color-text); font-size: 1.8rem; font-weight: 600;">${isEditMode ? 'Editar' : 'Registrar'} Vacuna</h2>
            <form id="new-vaccine-form">
                ${isEditMode ? `<input type="hidden" id="vaccine-id" value="${vaccineToEdit.id}">` : ''}
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Nombre de la Vacuna:</label>
                    <select id="vaccine-name" required style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                        <option value="">Seleccione una vacuna</option>
                        ${Object.keys(predefinedVaccines).map(vaccine => `
                            <option value="${vaccine}" ${isEditMode && vaccineToEdit.name === vaccine ? 'selected' : ''}>
                                ${vaccine} (${predefinedVaccines[vaccine]} días)
                            </option>
                        `).join('')}
                        <option value="Otra" ${isEditMode && !Object.keys(predefinedVaccines).includes(vaccineToEdit.name) ? 'selected' : ''}>
                            Otra (Personalizada)
                        </option>
                    </select>
                    <input type="text" id="custom-vaccine-name" style="display: none; width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);"
                           value="${isEditMode && !Object.keys(predefinedVaccines).includes(vaccineToEdit.name) ? vaccineToEdit.name : ''}">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Animales:</label>
                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid var(--color-border); padding: 5px; border-radius: var(--border-radius); margin-top: 5px;">
                        <label style="display: block; margin-bottom: 5px; color: var(--color-text);">
                            <input type="checkbox" id="select-all-animals">
                            ${isEditMode ? 'Seleccionar todos los animales afectados' : 'Seleccionar todos los animales'}
                        </label>
                        ${animals.map(animal => `
                            <label style="display: block; margin-bottom: 5px; color: var(--color-text);">
                                <input type="checkbox" class="animal-checkbox" name="animals" value="${animal.id}"
                                    ${isEditMode ? (animalsToEdit.some(a => a.id === animal.id) ? 'checked' : '') : ''}>
                                ${animal.name} (${animal.registryId})
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Fecha de Aplicación:</label>
                    <input type="date" id="application-date" value="${isEditMode ? vaccineToEdit.applicationDate : formattedCurrentDate}" required
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Próxima Dosis (Opcional):</label>
                    <input type="date" id="next-dose-date" value="${isEditMode ? vaccineToEdit.nextDoseDate || getDefaultNextDose(vaccineToEdit.name, vaccineToEdit.applicationDate) : ''}"
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Notas (Opcional):</label>
                    <textarea id="vaccine-notes" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius); height: 80px;">${isEditMode ? vaccineToEdit.notes || '' : ''}</textarea>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="button" id="reset-form" class="btn-reset" style="padding: 8px 16px; background-color: var(--color-primary); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Limpiar</button>
                    <button type="button" id="cancel-form" class="btn-cancel" style="padding: 8px 16px; background-color: var(--color-error); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Cancelar</button>
                    <button type="submit" class="btn-save" style="padding: 8px 16px; background-color: var(--color-success); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">${isEditMode ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </form>
        `;

        const vaccineSelect = form.querySelector('#vaccine-name');
        const customVaccineInput = form.querySelector('#custom-vaccine-name');
        const applicationDateInput = form.querySelector('#application-date');
        const nextDoseDateInput = form.querySelector('#next-dose-date');

        vaccineSelect.addEventListener('change', () => {
            if (vaccineSelect.value === 'Otra') {
                customVaccineInput.style.display = 'block';
                nextDoseDateInput.removeAttribute('readonly');
            } else {
                customVaccineInput.style.display = 'none';
                const days = predefinedVaccines[vaccineSelect.value] || 0;
                if (days > 0 && applicationDateInput.value) {
                    const date = new Date(applicationDateInput.value);
                    date.setDate(date.getDate() + days);
                    nextDoseDateInput.value = date.toISOString().split('T')[0];
                }
                nextDoseDateInput.setAttribute('readonly', 'readonly');
            }
            if (vaccineSelect.value && predefinedVaccines[vaccineSelect.value] && !isEditMode) {
                const date = new Date(applicationDateInput.value || formattedCurrentDate);
                date.setDate(date.getDate() + predefinedVaccines[vaccineSelect.value]);
                nextDoseDateInput.value = date.toISOString().split('T')[0];
            }
        });

        applicationDateInput.addEventListener('change', () => {
            if (vaccineSelect.value !== 'Otra' && predefinedVaccines[vaccineSelect.value]) {
                const days = predefinedVaccines[vaccineSelect.value];
                const date = new Date(applicationDateInput.value);
                date.setDate(date.getDate() + days);
                nextDoseDateInput.value = date.toISOString().split('T')[0];
            }
        });

        if (!isEditMode && vaccineSelect.value && predefinedVaccines[vaccineSelect.value]) {
            const date = new Date(applicationDateInput.value || formattedCurrentDate);
            date.setDate(date.getDate() + predefinedVaccines[vaccineSelect.value]);
            nextDoseDateInput.value = date.toISOString().split('T')[0];
            nextDoseDateInput.setAttribute('readonly', 'readonly');
        }

        const selectAllCheckbox = form.querySelector('#select-all-animals');
        const animalCheckboxes = form.querySelectorAll('.animal-checkbox');

        selectAllCheckbox.addEventListener('change', () => {
            animalCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });

        animalCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(animalCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            });
        });

        const closeForm = () => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            this.formOpen = false;
        };

        form.querySelector('#reset-form').addEventListener('click', () => {
            form.querySelector('#new-vaccine-form').reset();
            selectAllCheckbox.checked = false;
            animalCheckboxes.forEach(checkbox => checkbox.checked = false);
            customVaccineInput.style.display = 'none';
            nextDoseDateInput.removeAttribute('readonly');
            applicationDateInput.value = formattedCurrentDate;
            if (vaccineSelect.value && predefinedVaccines[vaccineSelect.value]) {
                const date = new Date(formattedCurrentDate);
                date.setDate(date.getDate() + predefinedVaccines[vaccineSelect.value]);
                nextDoseDateInput.value = date.toISOString().split('T')[0];
                nextDoseDateInput.setAttribute('readonly', 'readonly');
            } else {
                nextDoseDateInput.value = '';
            }
        });

        form.querySelector('#cancel-form').addEventListener('click', closeForm);

        form.querySelector('#new-vaccine-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const selectedAnimals = Array.from(animalCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);

            if (selectedAnimals.length === 0) {
                this.showToast('Por favor, selecciona al menos un animal para asignar la vacuna.', 'error');
                return;
            }

            let vaccineName = vaccineSelect.value;
            if (vaccineName === 'Otra') {
                vaccineName = customVaccineInput.value.trim();
                if (!vaccineName) {
                    this.showToast('Por favor, ingrese un nombre para la vacuna personalizada.', 'error');
                    return;
                }
            }

            const applicationDate = applicationDateInput.value;
            if (!applicationDate) {
                this.showToast('Por favor, ingrese una fecha de aplicación válida.', 'error');
                return;
            }

            const vaccineBaseData = {
                name: vaccineName,
                applicationDate: applicationDate,
                nextDoseDate: nextDoseDateInput.value || null,
                notes: form.querySelector('#vaccine-notes').value || null,
            };

            try {
                if (isEditMode) {
                    const vaccines = this.dataManager.getVaccines();
                    const affectedVaccines = vaccines.filter(v =>
                        v.name === vaccineToEdit.name &&
                        v.applicationDate === vaccineToEdit.applicationDate
                    );

                    for (const animalId of selectedAnimals) {
                        const animal = animals.find(a => a.id === animalId);
                        const existingVaccine = affectedVaccines.find(v => v.animalId === animalId);
                        const originalFileName = originalFileNames.find(f => f.animalId === animalId)?.fileName;

                        if (existingVaccine) {
                            const vaccineData = {
                                ...vaccineBaseData,
                                id: existingVaccine.id,
                                animalId: animalId,
                                originalFileName: originalFileName || `${animal.name.replace(/[^a-zA-Z0-9]/g, '_')}_${vaccineName.replace(/[^a-zA-Z0-9]/g, '_')}_${vaccineBaseData.applicationDate}.txt`
                            };
                            await this.updateVaccine(vaccineData);
                        } else {
                            const vaccineId = `V${Date.now()}_${animalId}`;
                            const vaccineData = {
                                ...vaccineBaseData,
                                id: vaccineId,
                                animalId: animalId
                            };
                            await this.saveVaccine(animal.name, vaccineData);
                        }
                    }

                    this.showToast('Vacuna actualizada correctamente', 'success');
                } else {
                    for (const animalId of selectedAnimals) {
                        const animal = animals.find(a => a.id === animalId);
                        const vaccineId = `V${Date.now()}_${animalId}`;
                        const vaccineData = {
                            ...vaccineBaseData,
                            id: vaccineId,
                            animalId: animalId
                        };
                        await this.saveVaccine(animal.name, vaccineData);
                    }
                    this.showToast('Vacuna(s) registrada(s) correctamente', 'success');
                }

                closeForm();
                this.renderVaccines();
                if (this.dashboardManager) this.dashboardManager.updateDashboard();
                if (this.reportManager) this.reportManager.updateReports();
            } catch (error) {
                this.showToast(`Ocurrió un error al guardar la vacuna: ${error.message}`, 'error');
            }
        });

        const existingOverlay = document.querySelector('.form-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        overlay.appendChild(form);
        document.body.appendChild(overlay);
    }

    // Método para guardar una nueva vacuna
    async saveVaccine(animalName, vaccineData) {
        try {
            let vaccines = this.dataManager.getVaccines();
            vaccines.push(vaccineData);
            this.dataManager.setVaccines(vaccines);

            const safeAnimalName = animalName.replace(/[^a-zA-Z0-9]/g, '_');
            const safeVaccineName = vaccineData.name.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${safeAnimalName}_${safeVaccineName}_${vaccineData.applicationDate}.txt`;

            const response = await fetch('http://localhost:3000/api/vaccines/save-per-animal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ animalName: safeAnimalName, vaccine: vaccineData, fileName })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Error al guardar la vacuna en el servidor: ' + errorText);
            }

            const result = await response.json();

            vaccineData.originalFileName = fileName;
            this.dataManager.saveDataToLocalStorage();
        } catch (error) {
            throw error;
        }
    }

    // Método para actualizar una vacuna existente
    async updateVaccine(vaccineData) {
        try {
            let vaccines = this.dataManager.getVaccines();
            const index = vaccines.findIndex(v => v.id === vaccineData.id);
            if (index !== -1) {
                vaccines[index] = vaccineData;
                this.dataManager.setVaccines(vaccines);
            }

            const animal = this.dataManager.getAnimals().find(a => a.id === vaccineData.animalId);
            if (!animal) {
                throw new Error('Animal no encontrado para esta vacuna');
            }

            const safeAnimalName = animal.name.replace(/[^a-zA-Z0-9]/g, '_');
            const safeVaccineName = vaccineData.name.replace(/[^a-zA-Z0-9]/g, '_');
            const newFileName = `${safeAnimalName}_${safeVaccineName}_${vaccineData.applicationDate}.txt`;
            const originalFileName = vaccineData.originalFileName || newFileName;

            const response = await fetch(`http://localhost:3000/api/vaccines/${vaccineData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...vaccineData, 
                    fileName: newFileName, 
                    originalFileName: originalFileName
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al actualizar la vacuna en el servidor: ${errorText}`);
            }

            const result = await response.json();

            vaccines[index].originalFileName = newFileName;
            this.dataManager.setVaccines(vaccines);
            this.dataManager.saveDataToLocalStorage();
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Método para editar una vacuna existente
    editVaccine(vaccineId) {
        const vaccines = this.dataManager.getVaccines();
        const vaccineToEdit = vaccines.find(v => v.id === vaccineId);
        if (!vaccineToEdit) {
            this.showToast('Vacuna no encontrada.', 'error');
            return;
        }

        const affectedVaccines = vaccines.filter(v =>
            v.name === vaccineToEdit.name &&
            v.applicationDate === vaccineToEdit.applicationDate
        );
        const animalsToEdit = affectedVaccines.map(v => {
            const animal = this.dataManager.getAnimals().find(a => a.id === v.animalId);
            return animal || { id: v.animalId, name: 'Desconocido', registryId: 'N/A' };
        });

        const originalFileNames = affectedVaccines.map(v => {
            const animal = this.dataManager.getAnimals().find(a => a.id === v.animalId);
            const safeAnimalName = animal.name.replace(/[^a-zA-Z0-9]/g, '_');
            const safeVaccineName = v.name.replace(/[^a-zA-Z0-9]/g, '_');
            return {
                animalId: v.animalId,
                fileName: v.originalFileName || `${safeAnimalName}_${safeVaccineName}_${v.applicationDate}.txt`
            };
        });

        if (animalsToEdit.length > 0) {
            this.showVaccineForm(vaccineToEdit, animalsToEdit, originalFileNames);
        } else {
            this.showToast('No se encontraron animales asociados con esta vacuna.', 'error');
        }
    }

    // Método para eliminar una vacuna
    async deleteVaccine(vaccineId) {
        if (await this.showConfirmation('¿Estás seguro de eliminar esta vacuna?')) {
            try {
                const vaccines = this.dataManager.getVaccines();
                const vaccine = vaccines.find(v => v.id === vaccineId);
                if (!vaccine) {
                    throw new Error('Vacuna no encontrada');
                }

                const animal = this.dataManager.getAnimals().find(a => a.id === vaccine.animalId);
                if (!animal) {
                    throw new Error('Animal no encontrado para esta vacuna');
                }

                const safeAnimalName = animal.name.replace(/[^a-zA-Z0-9]/g, '_');
                const safeVaccineName = vaccine.name.replace(/[^a-zA-Z0-9]/g, '_');
                const fileName = vaccine.originalFileName || `${safeAnimalName}_${safeVaccineName}_${vaccine.applicationDate}.txt`;

                const updatedVaccines = vaccines.filter(v => v.id !== vaccineId);
                this.dataManager.setVaccines(updatedVaccines);

                const response = await fetch(`http://localhost:3000/api/vaccines/${vaccineId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al eliminar la vacuna en el servidor: ${errorText}`);
                }

                this.dataManager.saveDataToLocalStorage();
                this.renderVaccines();
                if (this.dashboardManager) this.dashboardManager.updateDashboard();
                if (this.reportManager) this.reportManager.updateReports();
                this.showToast('Vacuna eliminada correctamente', 'success');
            } catch (error) {
                this.showToast('Ocurrió un error al eliminar la vacuna: ' + error.message, 'error');
            }
        }
    }

    // Método para eliminar todas las vacunas
    async deleteAllVaccines() {
        if (await this.showConfirmation('¿Estás seguro de eliminar todas las vacunas?')) {
            try {
                const vaccines = this.dataManager.getVaccines();
                if (vaccines.length === 0) {
                    this.showToast('No hay vacunas para eliminar.', 'info');
                    return;
                }

                for (const vaccine of vaccines) {
                    const animal = this.dataManager.getAnimals().find(a => a.id === vaccine.animalId);
                    if (!animal) continue;

                    const safeAnimalName = animal.name.replace(/[^a-zA-Z0-9]/g, '_');
                    const safeVaccineName = vaccine.name.replace(/[^a-zA-Z0-9]/g, '_');
                    const fileName = vaccine.originalFileName || `${safeAnimalName}_${safeVaccineName}_${vaccine.applicationDate}.txt`;

                    const response = await fetch(`http://localhost:3000/api/vaccines/${vaccine.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileName })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                    }
                }

                this.dataManager.setVaccines([]);
                this.dataManager.saveDataToLocalStorage();
                this.renderVaccines();
                if (this.dashboardManager) this.dashboardManager.updateDashboard();
                if (this.reportManager) this.reportManager.updateReports();
                this.showToast('Todas las vacunas eliminadas correctamente', 'success');
            } catch (error) {
                this.showToast('Ocurrió un error al eliminar todas las vacunas: ' + error.message, 'error');
            }
        }
    }

// Método para mostrar notificaciones con Toastify

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

    // Método para mostrar un modal de confirmación
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

// Hacer VaccineManager global para el navegador
window.VaccineManager = VaccineManager;