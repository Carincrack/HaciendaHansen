const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const http = require('http'); // Para socket.io
const socketIo = require('socket.io'); // Para WebSocket
const ServerAdmin = require('./ServerAdmin'); // Importa el módulo de administración
const rateLimit = require('express-rate-limit'); // Añadimos rate limiting

const app = express();
const PORT = 3000;

// Middleware de límite de solicitudes


// Crear el servidor HTTP y montar socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Definir la ruta base del proyecto
const PROJECT_DIR = path.join(__dirname, 'base_data');
const BASE_DIR = path.join(PROJECT_DIR, 'animal-data');
const VACCINE_DIR = path.join(__dirname, 'data_vacunas');
const ARCHIVOS_DIR = path.join(VACCINE_DIR, 'archivos');
const EMBRYO_DIR = path.join(PROJECT_DIR, 'embriones_data');
console.log('Ruta de EMBRYO_DIR:', EMBRYO_DIR);

console.log('Ruta de PROJECT_DIR:', PROJECT_DIR);
console.log('Ruta de VACCINE_DIR:', VACCINE_DIR);
console.log('Ruta de ARCHIVOS_DIR:', ARCHIVOS_DIR);

const getAnimalDir = (animalName) => path.join(BASE_DIR, animalName);
const getDataDir = (animalName) => path.join(getAnimalDir(animalName), 'datos');
const getProfileDir = (animalName) => path.join(getAnimalDir(animalName), 'perfil');
const getTitleDir = (animalName) => path.join(getAnimalDir(animalName), 'titulo');
const getEmbryoDir = (embryoId) => path.join(EMBRYO_DIR, embryoId);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const animalName = req.body.animalName || 'temp';
        const type = req.body.type || 'profile';
        let targetDir = type === 'profile' ? getProfileDir(animalName) : getTitleDir(animalName);
        try {
            await fs.mkdir(targetDir, { recursive: true });
            console.log("Directorio destino creado:", targetDir);
            cb(null, targetDir);
        } catch (error) {
            console.error("Error al crear directorio:", error);
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        const registryId = req.body.registryId ? req.body.registryId.replace('/', '_') : `temp_${Date.now()}`;
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${registryId}${ext}`;
        console.log("Nombre de archivo generado:", filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        console.log("Procesando archivo válido:", file.originalname);
        cb(null, true);
    } else {
        console.log("Tipo de archivo no permitido:", file.originalname);
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
}).single('photo');

const vaccineStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await fs.mkdir(ARCHIVOS_DIR, { recursive: true });
            console.log("Directorio destino creado:", ARCHIVOS_DIR);
            cb(null, ARCHIVOS_DIR);
        } catch (error) {
            console.error("Error al crear directorio:", error);
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        const vaccineId = req.body.vaccineId || `temp_${Date.now()}`;
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${vaccineId}${ext}`;
        console.log("Nombre de archivo generado:", filename);
        cb(null, filename);
    }
});

const vaccineFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        console.log("Procesando archivo válido:", file.originalname);
        cb(null, true);
    } else {
        console.log("Tipo de archivo no permitido:", file.originalname);
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp) o PDFs'), false);
    }
};

const vaccineUpload = multer({
    storage: vaccineStorage,
    fileFilter: vaccineFileFilter
}).single('file');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(PROJECT_DIR, 'images')));
app.use('/Proyecto_Hacienda_HXX/animal-data', (req, res, next) => {
    console.log(`Solicitud a: ${req.path}, mapeada a: ${path.join(PROJECT_DIR, 'animal-data', req.path)}`);
    req.url = decodeURI(req.url);
    next();
}, express.static(path.join(PROJECT_DIR, 'animal-data')));
app.use('/Proyecto_Hacienda_HXX/data_vacunas/archivos', express.static(ARCHIVOS_DIR));

async function ensureBaseDirs() {
    try {
        await fs.mkdir(PROJECT_DIR, { recursive: true });
        console.log('Directorio creado:', PROJECT_DIR);
        await fs.mkdir(BASE_DIR, { recursive: true });
        console.log('Directorio creado:', BASE_DIR);
        await fs.mkdir(VACCINE_DIR, { recursive: true });
        console.log('Directorio creado:', VACCINE_DIR);
        await fs.mkdir(ARCHIVOS_DIR, { recursive: true });
        console.log('Directorio creado:', ARCHIVOS_DIR);
        await fs.mkdir(EMBRYO_DIR, { recursive: true });
        console.log('Directorio creado:', EMBRYO_DIR);
        console.log('Estructura de directorios base creada');
    } catch (error) {
        console.error('Error al crear estructura de directorios base:', error);
    }
}

ensureBaseDirs();

const embryoRoutes = require('./embryoRoutes')({
    fs,
    path,
    ensureBaseDirs,
    getEmbryoDir,
    EMBRYO_DIR
});
app.use('/embryo', embryoRoutes);

app.get('/animals', async (req, res) => {
    try {
        await ensureBaseDirs();
        const animals = [];
        try {
            await fs.access(BASE_DIR);
        } catch (error) {
            console.log('La carpeta base no existe aún');
            return res.json(animals);
        }
        const animalFolders = await fs.readdir(BASE_DIR);
        for (const folder of animalFolders) {
            const dataDir = getDataDir(folder);
            try {
                await fs.access(dataDir);
                const files = await fs.readdir(dataDir);
                for (const file of files) {
                    if (file.endsWith('.txt')) {
                        const filePath = path.join(dataDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const animalData = JSON.parse(content);
                        animalData.id = file.split('_').pop().replace('.txt', '');
                        animals.push(animalData);
                    }
                }
            } catch (error) {
                console.error(`Error al leer datos de ${folder}:`, error);
            }
        }
        res.json(animals);
    } catch (error) {
        console.error('Error al cargar animales:', error);
        res.status(500).json({ error: 'Error al cargar los datos' });
    }
});

app.post('/animals', async (req, res) => {
    try {
        await ensureBaseDirs();
        const animalData = req.body;
        const animalDir = getAnimalDir(animalData.name);
        const dataDir = getDataDir(animalData.name);

        await fs.mkdir(animalDir, { recursive: true });
        await fs.mkdir(dataDir, { recursive: true });
        await fs.mkdir(getProfileDir(animalData.name), { recursive: true });
        await fs.mkdir(getTitleDir(animalData.name), { recursive: true });

        const fileName = `${animalData.name.replace(/[^a-z0-9]/gi, '_')}_${animalData.id}.txt`;
        const filePath = path.join(dataDir, fileName);

        await fs.writeFile(filePath, JSON.stringify(animalData, null, 2));
        console.log("Animal guardado en:", filePath);
        res.json({ success: true, filePath });
    } catch (error) {
        console.error('Error al guardar animal:', error);
        res.status(500).json({ error: 'Error al guardar el animal' });
    }
});

app.post('/upload-profile-photo', (req, res, next) => {
    console.log("Solicitud recibida en /upload-profile-photo");
    console.log("Headers:", req.headers);
    console.log("Body inicial:", req.body);
    next();
}, upload, async (req, res) => {
    try {
        if (!req.file) {
            console.error("No se proporcionó ninguna imagen");
            return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
        }
        
        const { animalName, type, registryId } = req.body;
        console.log("Datos recibidos en endpoint:", { animalName, type, registryId, filename: req.file.filename });

        if (!animalName || !type || !registryId) {
            const tempPath = req.file.path;
            await fs.unlink(tempPath).catch(err => console.error("Error al eliminar archivo temporal:", err));
            console.error("Faltan parámetros obligatorios", { animalName, type, registryId });
            return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
        }

        let filename = req.file.filename;
        if (filename.startsWith('temp_')) {
            const newFilename = `${registryId.replace('/', '_')}${path.extname(filename)}`;
            const tempPath = req.file.path;
            const newPath = path.join(path.dirname(tempPath), newFilename);
            await fs.rename(tempPath, newPath);
            filename = newFilename;
            console.log(`Archivo renombrado de ${req.file.filename} a ${newFilename}`);
        }

        const correctDir = type === 'profile' ? getProfileDir(animalName) : getTitleDir(animalName);
        const tempPath = path.join(getProfileDir('temp'), filename);
        const correctPath = path.join(correctDir, filename);

        if (tempPath !== correctPath) {
            await fs.mkdir(correctDir, { recursive: true });
            await fs.rename(tempPath, correctPath);
            console.log(`Archivo movido de ${tempPath} a ${correctPath}`);
        }

        const relativePath = path.join(
            'Proyecto_Hacienda_HXX',
            'animal-data',
            animalName,
            type === 'profile' ? 'perfil' : 'titulo',
            filename
        );
        
        console.log("Ruta relativa generada:", `/${relativePath}`);
        res.json({ success: true, filePath: `/${relativePath}` });
    } catch (error) {
        console.error('Error al subir la foto:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar archivo temporal:", err));
        }
        res.status(500).json({ error: 'Error al subir la foto: ' + error.message });
    }
});

app.delete('/animals/:id', async (req, res) => {
    try {
        const animalId = req.params.id;
        try {
            await fs.access(BASE_DIR);
        } catch (error) {
            return res.status(404).json({ error: 'No existe la carpeta base' });
        }
        const animalFolders = await fs.readdir(BASE_DIR);
        for (const folder of animalFolders) {
            const dataDir = getDataDir(folder);
            try {
                const files = await fs.readdir(dataDir);
                for (const file of files) {
                    if (file.includes(animalId) && file.endsWith('.txt')) {
                        const filePath = path.join(dataDir, file);
                        await fs.unlink(filePath);
                        const animalDir = getAnimalDir(folder);
                        await fs.rm(animalDir, { recursive: true, force: true });
                        console.log("Carpeta eliminada:", animalDir);
                        return res.json({ success: true });
                    }
                }
            } catch (error) {
                console.error(`Error al procesar carpeta ${folder}:`, error);
            }
        }
        res.status(404).json({ error: 'Animal no encontrado' });
    } catch (error) {
        console.error('Error al eliminar animal:', error);
        res.status(500).json({ error: 'Error al eliminar el animal' });
    }
});

app.post('/delete-animal-folder', async (req, res) => {
    try {
        const { animalName } = req.body;
        if (!animalName) {
            return res.status(400).json({ error: 'Nombre de animal no proporcionado' });
        }
        const animalDir = getAnimalDir(animalName);
        try {
            await fs.access(animalDir);
            await fs.rm(animalDir, { recursive: true, force: true });
            console.log("Carpeta eliminada:", animalDir);
            res.json({ success: true });
        } catch (error) {
            console.error(`Error al eliminar carpeta ${animalDir}:`, error);
            res.status(404).json({ error: 'Carpeta de animal no encontrada' });
        }
    } catch (error) {
        console.error('Error al eliminar carpeta de animal:', error);
        res.status(500).json({ error: 'Error al eliminar la carpeta' });
    }
});

app.get('/api/vaccines', async (req, res) => {
    try {
        await ensureBaseDirs();
        const vaccines = [];
        try {
            await fs.access(VACCINE_DIR);
        } catch (error) {
            console.log('La carpeta de vacunas no existe aún');
            return res.json(vaccines);
        }

        const files = await fs.readdir(VACCINE_DIR);
        for (const file of files) {
            if (file.endsWith('.txt')) {
                const filePath = path.join(VACCINE_DIR, file);
                const content = await fs.readFile(filePath, 'utf8');
                try {
                    const vaccineData = JSON.parse(content);
                    vaccines.push(vaccineData);
                } catch (parseErr) {
                    console.error(`Error parseando ${file}:`, parseErr);
                }
            }
        }
        res.json(vaccines);
    } catch (error) {
        console.error('Error al cargar vacunas:', error);
        res.status(500).json({ error: 'Error al cargar los datos de vacunas' });
    }
});

app.post('/api/vaccines/save-per-animal', async (req, res) => {
    try {
        const { animalName, vaccine, fileName } = req.body;
        if (!animalName || !vaccine || !fileName) {
            return res.status(400).json({ error: 'Faltan datos requeridos: animalName, vaccine, fileName' });
        }

        await ensureBaseDirs();
        const filePath = path.join(VACCINE_DIR, fileName);

        const vaccineRecord = {
            id: vaccine.id,
            animalId: vaccine.animalId,
            name: vaccine.name,
            applicationDate: vaccine.applicationDate,
            nextDoseDate: vaccine.nextDoseDate || null,
            notes: vaccine.notes || null,
            completed: vaccine.completed || false,
            completedTime: vaccine.completedTime || null
        };

        await fs.writeFile(filePath, JSON.stringify(vaccineRecord, null, 2));
        console.log('Vacuna guardada en:', filePath);
        res.status(201).json({ success: true, filePath });
    } catch (error) {
        console.error('Error al guardar vacuna por animal:', error);
        res.status(500).json({ error: 'Error al guardar la vacuna' });
    }
});

app.patch('/api/vaccines/:id', async (req, res) => {
    try {
        const vaccineId = req.params.id;
        const { fileName, originalFileName, ...vaccineData } = req.body;

        console.log('Solicitud PATCH recibida:', {
            vaccineId: vaccineId,
            originalFileName: originalFileName,
            newFileName: fileName
        });

        if (!fileName || !originalFileName) {
            return res.status(400).json({ error: 'Falta el nombre del archivo (fileName o originalFileName)' });
        }

        const originalFilePath = path.join(VACCINE_DIR, originalFileName);
        const newFilePath = path.join(VACCINE_DIR, fileName);
        let found = false;

        try {
            await fs.access(originalFilePath);
            found = true;
            console.log('Archivo encontrado:', originalFilePath);

            if (originalFileName !== fileName) {
                await fs.rename(originalFilePath, newFilePath);
                console.log(`Archivo renombrado de ${originalFilePath} a ${newFilePath}`);
            }

            await fs.writeFile(newFilePath, JSON.stringify(vaccineData, null, 2));
            console.log('Vacuna actualizada en:', newFilePath);
        } catch (error) {
            console.error('Archivo no encontrado:', originalFilePath, error);
        }

        if (!found) {
            return res.status(404).json({ error: 'Registro de vacuna no encontrado' });
        }

        res.status(200).json({ message: 'Registro de vacuna actualizado', filePath: newFilePath });
    } catch (error) {
        console.error('Error al actualizar vacuna:', error);
        res.status(500).json({ error: 'Error al actualizar la vacuna' });
    }
});

app.delete('/api/vaccines/:id', async (req, res) => {
    try {
        const vaccineId = req.params.id;
        const { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({ error: 'Falta el nombre del archivo (fileName)' });
        }

        const filePath = path.join(VACCINE_DIR, fileName);
        let found = false;

        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            found = true;
            console.log('Vacuna eliminada:', filePath);
        } catch (error) {
            console.error('Archivo no encontrado:', error);
        }

        if (found) {
            res.json({ message: 'Registro de vacuna eliminado' });
        } else {
            res.status(404).json({ error: 'Vacuna no encontrada' });
        }
    } catch (error) {
        console.error('Error al eliminar vacuna:', error);
        res.status(500).json({ error: 'Error al eliminar la vacuna' });
    }
});

app.post('/api/vaccines/upload-file', vaccineUpload, async (req, res) => {
    try {
        if (!req.file) {
            console.error("No se proporcionó ningún archivo");
            return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        }

        const { vaccineId } = req.body;
        if (!vaccineId) {
            const tempPath = req.file.path;
            await fs.unlink(tempPath).catch(err => console.error("Error al eliminar archivo temporal:", err));
            console.error("Falta el vaccineId");
            return res.status(400).json({ error: 'Falta el vaccineId' });
        }

        const filename = req.file.filename;
        const relativePath = path.join('Proyecto_Hacienda_HXX', 'data_vacunas', 'archivos', filename);

        console.log("Archivo subido:", relativePath);
        res.json({ success: true, filePath: `/${relativePath}` });
    } catch (error) {
        console.error('Error al subir el archivo:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Error al eliminar archivo temporal:", err));
        }
        res.status(500).json({ error: 'Error al subir el archivo: ' + error.message });
    }
});

app.get('/dashboard-stats', async (req, res) => {
    try {
        await ensureBaseDirs();
        try {
            await fs.access(BASE_DIR);
        } catch (error) {
            return res.json({
                totalAnimals: 0,
                animalsByBreed: {},
                vaccinesByType: {},
                recentVaccines: []
            });
        }
        const stats = {
            totalAnimals: 0,
            animalsByBreed: {},
            vaccinesByType: {},
            recentVaccines: []
        };
        const animalFolders = await fs.readdir(BASE_DIR);
        for (const folder of animalFolders) {
            const dataDir = getDataDir(folder);
            try {
                await fs.access(dataDir);
                const files = await fs.readdir(dataDir);
                for (const file of files) {
                    if (file.endsWith('.txt')) {
                        const filePath = path.join(dataDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const animalData = JSON.parse(content);
                        stats.totalAnimals++;
                        const breed = animalData.breed || 'No especificada';
                        stats.animalsByBreed[breed] = (stats.animalsByBreed[breed] || 0) + 1;
                    }
                }
            } catch (error) {
                console.error(`Error al procesar datos de ${folder}:`, error);
            }
        }

        try {
            await fs.access(VACCINE_DIR);
            const vaccineFiles = await fs.readdir(VACCINE_DIR);
            for (const file of vaccineFiles) {
                if (file.endsWith('.txt')) {
                    const vaccinePath = path.join(VACCINE_DIR, file);
                    const vaccineContent = await fs.readFile(vaccinePath, 'utf8');
                    const vaccineData = JSON.parse(vaccineContent);
                    const vaccineType = vaccineData.vaccine || 'No especificada';
                    stats.vaccinesByType[vaccineType] = (stats.vaccinesByType[vaccineType] || 0) + 1;

                    const animalFolder = animalFolders.find(folder => {
                        const dataDir = getDataDir(folder);
                        try {
                            const files = fs.readdirSync(dataDir);
                            return files.some(f => f.includes(vaccineData.animalId) && f.endsWith('.txt'));
                        } catch (err) {
                            return false;
                        }
                    });

                    if (animalFolder) {
                        const dataDir = getDataDir(animalFolder);
                        const animalFiles = await fs.readdir(dataDir);
                        const animalFile = animalFiles.find(f => f.includes(vaccineData.animalId) && f.endsWith('.txt'));
                        if (animalFile) {
                            const animalPath = path.join(dataDir, animalFile);
                            const animalContent = await fs.readFile(animalPath, 'utf8');
                            const animalData = JSON.parse(animalContent);
                            stats.recentVaccines.push({
                                ...vaccineData,
                                animalName: animalData.name,
                                animalBreed: animalData.breed
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error al procesar vacunas para estadísticas:', error);
        }

        stats.recentVaccines.sort((a, b) => new Date(b.date) - new Date(a.date));
        stats.recentVaccines = stats.recentVaccines.slice(0, 5);
        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Inicializa el módulo de administración
new ServerAdmin(io);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});