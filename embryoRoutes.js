const express = require('express');
const router = express.Router();

module.exports = function({ fs, path, ensureBaseDirs, getEmbryoDir, EMBRYO_DIR }) {
    router.post('/', async (req, res) => {
        try {
            await ensureBaseDirs();
            const { receptorId, donorMotherId, donorFatherId, pregnancyConfirmation, timestamp, embryoId } = req.body;

            if (!receptorId || !donorMotherId || !donorFatherId || !pregnancyConfirmation || !timestamp || !embryoId) {
                console.log('Datos faltantes en la solicitud:', req.body);
                return res.status(400).json({ error: 'Faltan datos requeridos en la solicitud' });
            }

            const embryoFolder = getEmbryoDir(embryoId);
            console.log(`Intentando crear carpeta: ${embryoFolder}`);

            await fs.mkdir(embryoFolder, { recursive: true });
            try {
                await fs.access(embryoFolder); // Verificar que la carpeta se creó
                console.log(`Carpeta creada y accesible: ${embryoFolder}`);
            } catch (error) {
                console.error(`Error al verificar la carpeta: ${embryoFolder}`, error);
                throw new Error(`No se pudo crear la carpeta: ${embryoFolder}`);
            }

            const filePath = path.join(embryoFolder, 'data.json');
            const embryoData = {
                receptorId,
                donorMotherId,
                donorFatherId,
                pregnancyConfirmation,
                timestamp,
                embryoId
            };

            await fs.writeFile(filePath, JSON.stringify(embryoData, null, 2));
            console.log(`Archivo guardado en: ${filePath}`);
            res.status(200).json({ message: 'Embrión guardado con éxito', embryoId, embryoData });
        } catch (error) {
            console.error('Error al guardar el embrión:', error);
            res.status(500).json({ error: `Error al guardar el embrión: ${error.message}` });
        }
    });

    router.get('/', async (req, res) => {
        try {
            await ensureBaseDirs();
            const embryos = [];
            try {
                await fs.access(EMBRYO_DIR);
            } catch (error) {
                console.log('La carpeta de embriones no existe aún');
                return res.json(embryos);
            }

            const embryoFolders = await fs.readdir(EMBRYO_DIR);
            for (const folder of embryoFolders) {
                const filePath = path.join(EMBRYO_DIR, folder, 'data.json');
                try {
                    await fs.access(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const embryoData = JSON.parse(content);
                    embryos.push(embryoData);
                } catch (error) {
                    console.error(`Error al leer datos de ${folder}:`, error);
                }
            }
            res.status(200).json(embryos);
        } catch (error) {
            console.error('Error al cargar embriones:', error);
            res.status(500).json({ error: 'Error al cargar los datos de embriones' });
        }
    });

    router.patch('/:id', async (req, res) => {
        try {
            const embryoId = req.params.id;
            const embryoData = req.body;

            if (!embryoId) {
                return res.status(400).json({ error: 'Falta el ID del embrión' });
            }

            const embryoFolder = getEmbryoDir(embryoId);
            const filePath = path.join(embryoFolder, 'data.json');

            // Verificar si el embrión existe antes de intentar actualizarlo
            try {
                await fs.access(filePath);
                console.log('Archivo encontrado:', filePath);
            } catch (error) {
                console.error('Archivo no encontrado:', filePath, error);
                return res.status(404).json({ error: 'Embrión no encontrado' });
            }

            await fs.writeFile(filePath, JSON.stringify(embryoData, null, 2));
            console.log('Embrión actualizado en:', filePath);

            res.status(200).json({ message: 'Embrión actualizado', filePath });
        } catch (error) {
            console.error('Error al actualizar embrión:', error);
            res.status(500).json({ error: `Error al actualizar el embrión: ${error.message}` });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            const embryoId = req.params.id;
            if (!embryoId) {
                return res.status(400).json({ error: 'Falta el ID del embrión' });
            }

            const embryoFolder = getEmbryoDir(embryoId);
            console.log(`Intentando eliminar carpeta: ${embryoFolder}`);

            try {
                await fs.access(embryoFolder);
                await fs.rm(embryoFolder, { recursive: true, force: true });
                console.log(`Carpeta eliminada: ${embryoFolder}`);
                res.status(200).json({ message: 'Embrión eliminado' });
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log(`Carpeta no encontrada: ${embryoFolder}`, error);
                    return res.status(404).json({ error: 'Embrión no encontrado' });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error al eliminar embrión:', error);
            res.status(500).json({ error: `Error al eliminar el embrión: ${error.message}` });
        }
    });

    return router;
};