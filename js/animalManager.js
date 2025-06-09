class AnimalManager {
    constructor(dataManager, dashboardManager) {
        this.dataManager = dataManager;
        this.dashboardManager = dashboardManager;
        this.formOpen = false;
        this.photoPrefix = 'animalPhoto_';
        this.titlePhotoPrefix = 'animalTitlePhoto_';
    }

    renderAnimals() {
        const animalList = document.querySelector('.animal-list');
        if (!animalList) return;

        const animals = this.dataManager.getAnimals();
        const extensionsToTry = ['jpeg', 'jpg', 'png', 'webp', 'gif'];

        animalList.innerHTML = '';

        animals.forEach(animal => {
            const cleanRegistryId = encodeURIComponent(animal.registryId.replace('/', '_'));
            const nameEncoded = encodeURIComponent(animal.name);

            const animalCard = document.createElement('div');
            animalCard.classList.add('animal-card');

            const imgContainer = document.createElement('div');
            imgContainer.classList.add('img-container');
            imgContainer.style.position = 'relative';

            const img = document.createElement('img');
            img.alt = `Foto de ${animal.name}`;
            img.classList.add('animal-photo');
            img.style = 'max-width: 300px; max-height: 200px; border-radius: 4px;';

            const tryExtensions = async () => {
                for (const ext of extensionsToTry) {
                    const url = `http://localhost:3000/Proyecto_Hacienda_HXX/animal-data/${nameEncoded}/perfil/${cleanRegistryId}.${ext}`;

                    const testImage = new Image();
                    testImage.src = url;

                    const loaded = await new Promise(resolve => {
                        testImage.onload = () => resolve(true);
                        testImage.onerror = () => resolve(false);
                    });

                    if (loaded) {
                        img.src = url;
                        return;
                    }
                }

                img.src = '/images/placeholder.jpg';
            };

            tryExtensions();

            // Añadir botón de ojo para ver en pantalla completa
            const viewButton = document.createElement('button');
            viewButton.classList.add('view-photo-btn');
            viewButton.innerHTML = '<i class="fa-solid fa-eye"></i>'; // Icono de ojo
            viewButton.style.cssText = `
                position: absolute; bottom: 6px; right: 6px;
                background-color: rgba(0, 0, 0, 0.6); color: white;
                border: none; border-radius: 50%; padding: 5px;
                cursor: pointer; font-size: 1.2rem;
            `;
            viewButton.addEventListener('click', () => this.showFullScreenPhoto(animal.registryId));

            imgContainer.appendChild(img);
            imgContainer.appendChild(viewButton);

            animalCard.innerHTML += `
                <h3>${animal.name} (${animal.registryId})</h3>
                <p>Registro: ${animal.registryId || 'N/A'}</p>
                <p>Raza: ${animal.breed}${animal.breed === 'Otra' && animal.customBreed ? ` (${animal.customBreed})` : ''}</p>
                <p>Peso: ${animal.weight} kg</p>
                <p>Nacimiento: ${animal.birthDate}</p>
                <div class="animal-actions">
                    <button class="btn-edit" data-id="${animal.id}">Editar</button>
                    <button class="btn-delete" data-id="${animal.id}">Eliminar</button>
                </div>
            `;

            animalCard.insertBefore(imgContainer, animalCard.firstChild);
            animalList.appendChild(animalCard);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.editAnimal(e.target.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteAnimal(e.target.dataset.id));
        });
    }

    showFullScreenPhoto(registryId) {
        const photoUrl = this.getAnimalPhoto(registryId);
        const titlePhotoUrl = this.getAnimalTitlePhoto(registryId);
        if (!photoUrl && !titlePhotoUrl) {
            this.showToast('No se encontraron fotos para este animal.', 'error');
            return;
        }

        let currentIndex = 0;
        const images = [photoUrl || '', titlePhotoUrl || ''].filter(url => url);

        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex; justify-content: center; align-items: center;
            z-index: 1001;
        `;

        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            position: relative; display: flex; justify-content: center; align-items: center;
            width: 90%; height: 90%; max-width: 1200px; max-height: 800px;
        `;

        const fullScreenImg = document.createElement('img');
        fullScreenImg.src = images[currentIndex] || '/images/placeholder.jpg';
        fullScreenImg.style.cssText = `
            max-width: 100%; max-height: 100%;
            border-radius: 4px; cursor: pointer;
            object-fit: contain; /* Asegura que la imagen se ajuste sin distorsionarse */
        `;

        // Botón Izquierda
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevButton.style.cssText = `
            position: absolute; left: 10px;
            background-color: rgba(255, 255, 255, 0.8); color: black;
            border: none; border-radius: 50%; padding: 10px;
            cursor: pointer; font-size: 1.5rem; z-index: 1002;
            transition: opacity 0.3s ease;
        `;
        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            fullScreenImg.src = images[currentIndex] || '/images/placeholder.jpg';
        });
        prevButton.addEventListener('mouseover', () => prevButton.style.opacity = '1');
        prevButton.addEventListener('mouseout', () => prevButton.style.opacity = '0.7');

        // Botón Derecha
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextButton.style.cssText = `
            position: absolute; right: 10px;
            background-color: rgba(255, 255, 255, 0.8); color: black;
            border: none; border-radius: 50%; padding: 10px;
            cursor: pointer; font-size: 1.5rem; z-index: 1002;
            transition: opacity 0.3s ease;
        `;
        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % images.length;
            fullScreenImg.src = images[currentIndex] || '/images/placeholder.jpg';
        });
        nextButton.addEventListener('mouseover', () => nextButton.style.opacity = '1');
        nextButton.addEventListener('mouseout', () => nextButton.style.opacity = '0.7');

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✖';
        closeButton.style.cssText = `
            position: absolute; top: 10px; right: 10px;
            background-color: rgba(255, 255, 255, 0.8); color: black;
            border: none; border-radius: 50%; padding: 5px 10px;
            cursor: pointer; font-size: 1.5rem;
        `;
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        imageContainer.appendChild(prevButton);
        imageContainer.appendChild(fullScreenImg);
        imageContainer.appendChild(nextButton);
        overlay.appendChild(imageContainer);
        overlay.appendChild(closeButton);
        document.body.appendChild(overlay);

        // Ajustar opacidad inicial de los botones
        prevButton.style.opacity = '0.7';
        nextButton.style.opacity = '0.7';

        // Cerrar con clic fuera de la imagen
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }

    showAnimalForm(animalToEdit = null) {
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
        form.className = 'animal-form';
        form.style.cssText = `
            background-color: var(--color-bg-light); padding: 20px; border-radius: var(--border-radius);
            width: 90%; max-width: 500px; max-height: 90vh;
            overflow-y: auto; box-shadow: var(--shadow-soft);
        `;

        const isEditMode = animalToEdit !== null;
        const currentPhoto = isEditMode ? this.getAnimalPhoto(animalToEdit.registryId) : null;
        const currentTitlePhoto = isEditMode ? this.getAnimalTitlePhoto(animalToEdit.registryId) : null;

        form.innerHTML = `
            <h2 style="margin-top: 0; color: var(--color-text); font-size: 1.8rem; font-weight: 600;">${isEditMode ? 'Editar' : 'Registrar'} Animal</h2>
            <form id="new-animal-form">
                ${isEditMode ? `<input type="hidden" id="animal-id" value="${animalToEdit.id}">` : ''}
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Nombre:</label>
                    <input type="text" id="animal-name" value="${isEditMode ? animalToEdit.name : ''}" required 
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">ID Registro (ej: 356/21):</label>
                    <input type="text" id="animal-registry" value="${isEditMode ? animalToEdit.registryId || '' : ''}" 
                           required pattern="\\d{1,4}/\\d{2}" title="Formato: números/ejemplo 356/21"
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Raza:</label>
                    <select id="animal-breed" required 
                            style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                        <option value="">Seleccione...</option>
                        <option value="Angus" ${isEditMode && animalToEdit.breed === 'Angus' ? 'selected' : ''}>Angus</option>
                        <option value="Hereford" ${isEditMode && animalToEdit.breed === 'Hereford' ? 'selected' : ''}>Hereford</option>
                        <option value="Brahman" ${isEditMode && animalToEdit.breed === 'Brahman' ? 'selected' : ''}>Brahman</option>
                        <option value="Otra" ${isEditMode && animalToEdit.breed === 'Otra' ? 'selected' : ''}>Otra</option>
                    </select>
                    <input type="text" id="custom-breed" style="display: none; width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);"
                           placeholder="Especifique la raza" value="${isEditMode && animalToEdit.breed === 'Otra' && animalToEdit.customBreed ? animalToEdit.customBreed : ''}">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Peso (kg):</label>
                    <input type="number" id="animal-weight" value="${isEditMode ? animalToEdit.weight : ''}" 
                           min="0" step="0.1" required
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div class="form-group">
                    <label style="color: var(--color-text); font-weight: 500;">Fecha Nacimiento:</label>
                    <input type="date" id="animal-birth" value="${isEditMode ? animalToEdit.birthDate : ''}" required
                           style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
                </div>
                <div class="form-group">
                <label class="custom-file-label">
                    <span class="custom-file-btn">Seleccionar foto</span>
                    <input type="file" id="animal-photo" accept="image/*" ${!isEditMode ? 'required' : ''}>
                </label>

                <div id="photo-preview" style="margin-top: 10px;">
                    ${currentPhoto ? `<img src="${currentPhoto}" style="max-width: 200px; max-height: 100px; border-radius: 4px;">` : ''}
                </div>
                </div>

                            <div class="form-group">
                <label class="custom-file-label">
                    <span class="custom-file-btn">Seleccionar foto de título</span>
                    <input type="file" id="animal-title-photo" accept="image/*">
                </label>

                <div id="title-photo-preview" style="margin-top: 10px;">
                    ${currentTitlePhoto ? `<img src="${currentTitlePhoto}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : ''}
                </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="button" id="reset-form" class="btn-reset" style="padding: 8px 16px; background-color: var(--color-primary); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Limpiar</button>
                    <button type="button" id="cancel-form" class="btn-cancel" style="padding: 8px 16px; background-color: var(--color-error); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">Cancelar</button>
                    <button type="submit" class="btn-save" style="padding: 8px 16px; background-color: var(--color-success); color: var(--color-text-white); border: 1px solid var(--color-border); border-radius: var(--border-radius);">${isEditMode ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </form>
        `;

        const photoInput = form.querySelector('#animal-photo');
        const photoPreview = form.querySelector('#photo-preview');
        const titlePhotoInput = form.querySelector('#animal-title-photo');
        const titlePhotoPreview = form.querySelector('#title-photo-preview');

        const breedSelect = form.querySelector('#animal-breed');
        const customBreedInput = form.querySelector('#custom-breed');

        breedSelect.addEventListener('change', () => {
            if (breedSelect.value === 'Otra') {
                customBreedInput.style.display = 'block';
                customBreedInput.required = true;
            } else {
                customBreedInput.style.display = 'none';
                customBreedInput.required = false;
                customBreedInput.value = '';
            }
        });

        if (isEditMode && animalToEdit.breed === 'Otra') {
            customBreedInput.style.display = 'block';
            customBreedInput.required = true;
        }

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
                if (file.size > maxSizeInBytes) {
                    this.showToast('La foto de perfil excede el tamaño máximo permitido de 50MB.', 'error');
                    photoInput.value = '';
                    photoPreview.innerHTML = currentPhoto ? `<img src="${currentPhoto}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    photoPreview.innerHTML = `
                        <img src="${event.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });

        titlePhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSizeInBytes) {
                    this.showToast('La foto de título excede el tamaño máximo permitido de 10MB.', 'error');
                    titlePhotoInput.value = '';
                    titlePhotoPreview.innerHTML = currentTitlePhoto ? `<img src="${currentTitlePhoto}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    titlePhotoPreview.innerHTML = `
                        <img src="${event.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });

        const closeForm = () => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            this.formOpen = false;
        };

        form.querySelector('#reset-form').addEventListener('click', () => {
            form.querySelector('#new-animal-form').reset();
            photoPreview.innerHTML = currentPhoto ? `<img src="${currentPhoto}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : '';
            titlePhotoPreview.innerHTML = currentTitlePhoto ? `<img src="${currentTitlePhoto}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : '';
            customBreedInput.style.display = 'none';
            customBreedInput.value = '';
        });

        form.querySelector('#cancel-form').addEventListener('click', closeForm);

        form.querySelector('#new-animal-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const animalData = {
                id: isEditMode ? animalToEdit.id : `A${(this.dataManager.getAnimals().length + 1).toString().padStart(3, '0')}`,
                name: form.querySelector('#animal-name').value,
                registryId: form.querySelector('#animal-registry').value,
                breed: form.querySelector('#animal-breed').value,
                customBreed: form.querySelector('#animal-breed').value === 'Otra' ? form.querySelector('#custom-breed').value : '',
                weight: parseFloat(form.querySelector('#animal-weight').value),
                birthDate: form.querySelector('#animal-birth').value
            };

            if (!animalData.registryId) {
                this.showToast('Error: El ID de registro es obligatorio.', 'error');
                return;
            }

            try {
                const photoFile = form.querySelector('#animal-photo').files[0];
                const titlePhotoFile = form.querySelector('#animal-title-photo').files[0];

                let oldName = null;
                let nameChanged = false;

                if (isEditMode) {
                    oldName = animalToEdit.name;
                    nameChanged = oldName !== animalData.name;
                }

                if (!isEditMode && !photoFile) {
                    this.showToast('La foto de perfil es obligatoria para registrar un animal.', 'error');
                    return;
                }

                await this.saveAnimal(animalData, isEditMode ? animalToEdit.id : null);

                if (nameChanged) {
                    try {
                        await fetch('http://localhost:3000/animals', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(animalData)
                        });

                        await fetch('http://localhost:3000/delete-animal-folder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ animalName: oldName }),
                        });
                    } catch (error) {
                        throw new Error("Error al actualizar carpetas: " + error.message);
                    }
                }

                if (photoFile) {
                    const formData = new FormData();
                    formData.append('photo', photoFile);
                    formData.append('registryId', animalData.registryId);
                    formData.append('animalName', animalData.name);
                    formData.append('type', 'profile');

                    const response = await fetch('http://localhost:3000/upload-profile-photo', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Error al subir la foto de perfil: ${errorText}`);
                    }

                    const result = await response.json();
                    this.saveAnimalPhoto(animalData.registryId, result.filePath);
                } else if (isEditMode && currentPhoto) {
                    const oldRegistryId = animalToEdit.registryId;
                    if (oldRegistryId !== animalData.registryId) {
                        this.saveAnimalPhoto(animalData.registryId, currentPhoto);
                        localStorage.removeItem(`${this.photoPrefix}${oldRegistryId}`);
                    }
                }

                if (titlePhotoFile) {
                    const formData = new FormData();
                    formData.append('photo', titlePhotoFile);
                    formData.append('registryId', animalData.registryId);
                    formData.append('animalName', animalData.name);
                    formData.append('type', 'title');

                    const response = await fetch('http://localhost:3000/upload-profile-photo', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Error al subir la foto de título: ${errorText}`);
                    }

                    const result = await response.json();
                    this.saveAnimalTitlePhoto(animalData.registryId, result.filePath);
                } else if (isEditMode && currentTitlePhoto) {
                    const oldRegistryId = animalToEdit.registryId;
                    if (oldRegistryId !== animalData.registryId) {
                        this.saveAnimalTitlePhoto(animalData.registryId, currentTitlePhoto);
                        localStorage.removeItem(`${this.titlePhotoPrefix}${oldRegistryId}`);
                    }
                }

                closeForm();
                this.renderAnimals();
                this.showToast(isEditMode ? 'Animal actualizado correctamente' : 'Animal registrado correctamente', 'success');
            } catch (error) {
                this.showToast('Ocurrió un error al guardar los datos: ' + error.message, 'error');
            }
        });

        const existingOverlay = document.querySelector('.form-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        overlay.appendChild(form);
        document.body.appendChild(overlay);
    }

    async saveAnimal(animalData, animalIdToUpdate = null) {
        try {
            let animals = this.dataManager.getAnimals();

            if (animalIdToUpdate) {
                const index = animals.findIndex(a => a.id === animalIdToUpdate);
                if (index !== -1) {
                    animals[index] = animalData;
                }
            } else {
                animals.push(animalData);
            }

            this.dataManager.setAnimals(animals);
            const saveResult = await this.dataManager.saveAnimalToFile(animalData);
            this.dataManager.saveDataToLocalStorage();

            this.dashboardManager.updateDashboard();
            document.dispatchEvent(new CustomEvent('animalAdded'));
            return true;
        } catch (error) {
            throw error;
        }
    }

    saveAnimalPhoto(registryId, filePath) {
        localStorage.setItem(`${this.photoPrefix}${registryId}`, filePath);
    }

    getAnimalPhoto(registryId) {
        return localStorage.getItem(`${this.photoPrefix}${registryId}`);
    }

    saveAnimalTitlePhoto(registryId, filePath) {
        localStorage.setItem(`${this.titlePhotoPrefix}${registryId}`, filePath);
    }

    getAnimalTitlePhoto(registryId) {
        return localStorage.getItem(`${this.titlePhotoPrefix}${registryId}`);
    }

    editAnimal(animalId) {
        const animals = this.dataManager.getAnimals();
        const animalToEdit = animals.find(a => a.id === animalId);
        if (animalToEdit) this.showAnimalForm(animalToEdit);
    }

    async deleteAnimal(animalId) {
        if (await this.showConfirmation('¿Estás seguro de eliminar este animal?')) {
            try {
                const animals = this.dataManager.getAnimals();
                const animal = animals.find(a => a.id === animalId);

                if (!animal) {
                    throw new Error('Animal no encontrado');
                }

                localStorage.removeItem(`${this.photoPrefix}${animal.registryId}`);
                localStorage.removeItem(`${this.titlePhotoPrefix}${animal.registryId}`);

                const response = await fetch(`http://localhost:3000/animals/${animalId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar animal del servidor');
                }

                const updatedAnimals = animals.filter(a => a.id !== animalId);
                const updatedVaccines = this.dataManager.getVaccines().filter(v => v.animalId !== animalId);

                this.dataManager.setAnimals(updatedAnimals);
                this.dataManager.setVaccines(updatedVaccines);
                this.dataManager.saveDataToLocalStorage();

                this.renderAnimals();
                this.dashboardManager.updateDashboard();
                document.dispatchEvent(new CustomEvent('animalDeleted'));

                this.showToast('Animal eliminado correctamente', 'success');
            } catch (error) {
                this.showToast('Ocurrió un error al eliminar el animal: ' + error.message, 'error');
            }
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

window.AnimalManager = AnimalManager;