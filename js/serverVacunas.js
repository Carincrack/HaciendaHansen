const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Directorio para almacenar los registros de vacunas
const VACCINE_DIR = path.join(__dirname, 'vaccine_records');
const REPORTS_DIR = path.join(__dirname, 'reports');

// Crear las carpetas si no existen
if (!fs.existsSync(VACCINE_DIR)) {
    fs.mkdirSync(VACCINE_DIR, { recursive: true });
}
if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Endpoint para guardar o actualizar registros de vacunas
app.post('/api/vaccines', (req, res) => {
    const vaccines = req.body;

    if (!Array.isArray(vaccines)) {
        return res.status(400).json({ error: 'Se esperaba un arreglo de vacunas' });
    }

    const updates = [];
    vaccines.forEach(vaccine => {
        if (!vaccine.animalId || !vaccine.vaccine || !vaccine.date) {
            return res.status(400).json({ error: 'Faltan datos requeridos: animalId, vaccine, date' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const vaccineId = `${vaccine.animalId}_${timestamp}`;
        const fileName = `vaccine_${vaccineId}.json`;
        const filePath = path.join(VACCINE_DIR, fileName);

        const vaccineRecord = { 
            id: vaccineId, 
            ...vaccine,
            completed: vaccine.completed || false,
            completedTime: vaccine.completedTime || null
        };

        fs.writeFile(filePath, JSON.stringify(vaccineRecord, null, 2), (err) => {
            if (err) {
                console.error(`Error al guardar ${fileName}:`, err);
            } else {
                updates.push({ message: 'Registro de vacuna guardado', vaccineId });
            }
        });
    });

    // Respuesta después de procesar todos los archivos
    res.status(201).json({ message: 'Registros de vacunas guardados', updates });
});

// Endpoint para recuperar todos los registros de vacunas
app.get('/api/vaccines', (req, res) => {
    fs.readdir(VACCINE_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los registros' });
        }

        const vaccineRecords = [];
        let filesProcessed = 0;

        if (files.length === 0) {
            return res.json([]);
        }

        files.forEach(file => {
            const filePath = path.join(VACCINE_DIR, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error leyendo ${file}:`, err);
                } else {
                    try {
                        const record = JSON.parse(data);
                        vaccineRecords.push(record);
                    } catch (parseErr) {
                        console.error(`Error parseando ${file}:`, parseErr);
                    }
                }

                filesProcessed++;
                if (filesProcessed === files.length) {
                    res.json(vaccineRecords);
                }
            });
        });
    });
});

// Endpoint para eliminar un registro de vacuna por ID
app.delete('/api/vaccines/:id', (req, res) => {
    const vaccineId = req.params.id;
    const fileName = `vaccine_${vaccineId}.json`;
    const filePath = path.join(VACCINE_DIR, fileName);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.status(200).json({ message: 'Registro de vacuna eliminado' });
    });
});

// Endpoint para generar y descargar el reporte PDF de vacunas finalizadas
app.post('/api/generate-report', (req, res) => {
    const { vaccines } = req.body;
    if (!vaccines || vaccines.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron vacunas para el reporte' });
    }

    const doc = new PDFDocument();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(REPORTS_DIR, `vaccine_report_${timestamp}.pdf`);

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    doc.fontSize(20).text('Reporte de Vacunas Finalizadas', { align: 'center' });
    doc.moveDown();

    vaccines.forEach((record, index) => {
        doc.fontSize(12).text(`Registro ${index + 1}:`, { underline: true });
        doc.fontSize(10).text(`Animal: ${record.animalName || 'Desconocido'}`);
        doc.text(`Vacuna: ${record.vaccine}`);
        doc.text(`Fecha: ${record.date}`);
        doc.text(`Hora de Finalización: ${record.completedTime}`);
        doc.moveDown();
    });

    doc.end();

    writeStream.on('finish', () => {
        res.download(outputPath, `vaccine_report_${timestamp}.pdf`, (err) => {
            if (err) {
                res.status(500).json({ error: 'Error al descargar el reporte' });
            }
            fs.unlink(outputPath, (err) => {
                if (err) console.error('Error al eliminar el archivo temporal:', err);
            });
        });
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor de vacunas corriendo en http://localhost:${PORT}`);
});