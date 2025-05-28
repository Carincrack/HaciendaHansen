class ReportManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.reportOutput = null;
        this.previewContainer = null;
        this.detailedData = [];
        this.debounceTimeout = null;
        this.toastShown = false; // Initialize toast flag
        this.initialize();
    }

    debounce(func, wait) {
        return (...args) => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async loadAllVaccinesFromServer() {
        try {
            console.log("Intentando cargar vacunas desde el servidor...");
            const response = await fetch("http://localhost:3000/api/vaccines");
            if (!response.ok) {
                throw new Error(
                    `Error al cargar las vacunas: ${response.status} ${response.statusText}`
                );
            }
            const vaccines = await response.json();
            console.log("Vacunas recibidas del servidor:", vaccines);
            const formattedVaccines = vaccines.map((vaccine) => ({
                id: vaccine.id,
                animalId: vaccine.animalId,
                name: vaccine.name,
                applicationDate: vaccine.applicationDate,
                nextDoseDate: vaccine.nextDoseDate || "N/A",
                notes: vaccine.notes || "N/A",
            }));
            console.log("Vacunas formateadas:", formattedVaccines);
            return formattedVaccines;
        } catch (error) {
            console.error("Error al cargar vacunas:", error);
            this.showToast(`Error al cargar vacunas: ${error.message}`, "error");
            return [];
        }
    }

    getDetailedVaccineData(vaccines) {
        console.log("Procesando datos detallados de vacunas...");
        console.log("Vacunas recibidas:", vaccines);
        const animals =
            this.dataManager && typeof this.dataManager.getAnimals === "function"
                ? this.dataManager.getAnimals()
                : [];
        console.log("Animales obtenidos de dataManager:", animals);

        const detailedData = [];
        vaccines.forEach((vaccine) => {
            const animal = animals.find(
                (a) => String(a.id) === String(vaccine.animalId)
            );
            console.log(
                `Buscando animal para vaccine.animalId=${vaccine.animalId}:`,
                animal
            );
            if (animal) {
                detailedData.push({
                    animalName: animal.name,
                    animalId: vaccine.animalId,
                    vaccineName: vaccine.name,
                    applicationDate: this.formatDate(vaccine.applicationDate),
                    nextDoseDate:
                        vaccine.nextDoseDate !== "N/A"
                            ? this.formatDate(vaccine.nextDoseDate)
                            : "N/A",
                    status: this.getVaccineStatus(vaccine.nextDoseDate),
                });
            } else {
                console.warn(
                    `No se encontró animal para vaccine.animalId=${vaccine.animalId}`
                );
            }
        });

        console.log("Datos detallados generados:", detailedData);
        return detailedData.sort((a, b) => {
            if (a.animalName === b.animalName) {
                return new Date(a.applicationDate) - new Date(b.applicationDate);
            }
            return a.animalName.localeCompare(b.animalName);
        });
    }

    formatDate(dateString) {
        if (!dateString || dateString === "N/A") return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch (error) {
            return dateString;
        }
    }

    getVaccineStatus(nextDoseDate) {
        if (!nextDoseDate || nextDoseDate === "N/A") return "completa";
        const today = new Date();
        const nextDate = new Date(nextDoseDate);
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "vencida";
        if (diffDays <= 30) return "proxima";
        return "vigente";
    }

    getStatusColor(status) {
        switch (status) {
            case "vencida":
                return "#e74c3c";
            case "proxima":
                return "#f39c12";
            case "vigente":
                return "#27ae60";
            case "completa":
                return "#3498db";
            default:
                return "#3498db";
        }
    }

    getStatusColorRGB(status) {
        switch (status) {
            case "vencida":
                return [231, 76, 60];
            case "proxima":
                return [243, 156, 18];
            case "vigente":
                return [39, 174, 96];
            case "completa":
                return [52, 152, 219];
            default:
                return [52, 152, 219];
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case "vencida":
                return '<i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>';
            case "proxima":
                return '<i class="fas fa-bell" style="color: #f39c12;"></i>';
            case "vigente":
                return '<i class="fas fa-check-circle" style="color: #27ae60;"></i>';
            case "completa":
                return '<i class="fas fa-list" style="color: #3498db;"></i>';
            default:
                return '<i class="fas fa-list" style="color: #3498db;"></i>';
        }
    }

    async getImageAsBase64(imagePath) {
        try {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = this.width;
                    canvas.height = this.height;
                    ctx.drawImage(this, 0, 0);
                    const dataURL = canvas.toDataURL("image/png");
                    resolve(dataURL);
                };
                img.onerror = () => reject(new Error("Error al cargar la imagen"));
                img.src = imagePath;
            });
        } catch (error) {
            console.warn("No se pudo cargar el logo:", error);
            return null;
        }
    }

    updateStatus(index, newStatus) {
        this.detailedData[index].status = newStatus;
        this.showPreview(this.detailedData);
    }

    showPreview(detailedData) {
        console.log(
            "Entrando en showPreview, caller:",
            new Error().stack,
            "detailedData:",
            detailedData
        ); // Debug: Log call stack
        this.detailedData = detailedData;
        if (!this.previewContainer) {
            this.previewContainer = document.getElementById("report-preview");
        }

        if (detailedData.length === 0) {
            console.log(
                'Mostrando mensaje de "No hay datos" porque detailedData está vacío'
            ); // Debug: Log empty state
            this.previewContainer.innerHTML = `
            <div style="
                background: var(--color-primary);
                padding: 20px;
                border-radius: var(--border-radius);
                text-align: center;
                box-shadow: var(--shadow-soft);
            ">
                <i class="fas fa-exclamation-triangle" style="font-size: 36px; color: #f39c12; margin-bottom: 10px;"></i>
                <h3 style="color: var(--color-text-white); margin: 0 0 8px 0; font-size: 18px;">No hay registros de vacunación</h3>
                <p style="color: #ecf0f1; margin: 0; font-size: 14px;">No se encontraron vacunas registradas en el sistema.</p>
            </div>
        `;
            if (!this.toastShown) {
                // Use flag to prevent duplicate toasts
                this.showToast("No hay datos para el reporte.", "info");
                this.toastShown = true;
            }
            return;
        }
        // Reset flag when data is present
        this.toastShown = false;

        let tableHTML = `
        <div style="
            background: var(--color-primary);
            padding: 15px;
            border-radius: var(--color-border);
            margin-bottom: 15px;
      
        ">
            <h3 style="
                color: var(--color-text);
                margin: 0 0 8px 0;
                text-align: center;
                font-size: 22px;
                font-weight: 600;
            ">
                <i class="fas fa-cow" style="margin-right: 6px;"></i> CONTROL DE VACUNACIÓN
            </h3>
            <p style="
                color: #ecf0f1;
                text-align: center;
                margin: 0 0 10px 0;
                font-size: 14px;
            ">
                Gestión Ganadera Hacienda Hansen
            </p>
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255,255,255,0.15);
                padding: 8px 15px;
                border-radius: 4px;
            ">
                <span style="color: var(--color-text); font-size: 13px;">
                    <i class="fas fa-calendar-alt" style="margin-right: 4px;"></i> Generado: ${new Date().toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        )}
                </span>
                <span style="color: var(--color-text-white); font-size: 13px;">
                    <i class="fas fa-chart-bar" style="margin-right: 4px;"></i> Total registros: ${detailedData.length
            }
                </span>
            </div>
        </div>
    `;

        tableHTML += `
        <div style="
            background: var(--color-bg-light);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-soft);
        ">
            <div style="
                background: var(--color-primary);
                padding: 10px 0;
                text-align: center;
            ">
                <h4 style="
                    color: var(--color-text-white);
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                ">
                    <i class="fas fa-list-ul" style="margin-right: 4px;"></i> REGISTRO DETALLADO DE VACUNACIONES
                </h4>
            </div>
            <div style="overflow-x: auto;">
                <table style="
                    width: 100%;
                    border-collapse: collapse;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                ">
                    <thead>
                        <tr style="background: var(--color-gray-light);">
                            <th style="
                                padding: 10px 10px;
                                text-align: left;
                                color: var(--color-text);
                                font-weight: 600;
                                font-size: 13px;
                                border-bottom: 2px solid var(--color-primary);
                            ">
                                <i class="fas fa-cow" style="margin-right: 4px;"></i> ANIMAL
                            </th>
                            <th style="
                                padding: 10px 10px;
                                text-align: left;
                                color: var(--color-text);
                                font-weight: 600;
                                font-size: 13px;
                                border-bottom: 2px solid var(--color-primary);
                            ">
                                <i class="fas fa-syringe" style="margin-right: 4px;"></i> VACUNA
                            </th>
                            <th style="
                                padding: 10px 10px;
                                text-align: center;
                                color: var(--color-text);
                                font-weight: 600;
                                font-size: 13px;
                                border-bottom: 2px solid var(--color-primary);
                            ">
                                <i class="fas fa-calendar" style="margin-right: 4px;"></i> FECHA APLICACIÓN
                            </th>
                            <th style="
                                padding: 10px 10px;
                                text-align: center;
                                color: var(--color-tex);
                                font-weight: 600;
                                font-size: 13px;
                                border-bottom: 2px solid var(--color-primary);
                            ">
                                <i class="fas fa-bell" style="margin-right: 4px;"></i> PRÓXIMA DOSIS
                            </th>
                            <th style="
                                padding: 10px 10px;
                                text-align: center;
                                color: var(--color-text);
                                font-weight: 600;
                                font-size: 13px;
                                border-bottom: 2px solid var(--color-primary);
                            ">
                                <i class="fas fa-chart-line" style="margin-right: 4px;"></i> ESTADO
                            </th>
                        </tr>
                    </thead>
                    <tbody>
    `;

        detailedData.forEach((record, index) => {
            const isEven = index % 2 === 0;
            const currentStatus = record.status || "completa";
            const statusColor = this.getStatusColor(currentStatus);

            tableHTML += `
            <tr style="
                background: ${isEven ? "var(--color-border)" : "var(--color-white)"
                };
                border-bottom: 1px solid var(--color-border);
            ">
                <td style="
                    padding: 10px 10px;
                    color: var(--color-text);
                    font-weight: 500;
                    font-size: 13px;
                    border-right: 1px solid var(--color-border);
                ">
                    ${record.animalName || "Sin nombre"}
                </td>
                <td style="
                    padding: 10px 10px;
                    color: var(--color-text-dark);
                    font-size: 13px;
                    border-right: 1px solid var(--color-border);
                ">
                    ${record.vaccineName}
                </td>
                <td style="
                    padding: 10px 10px;
                    text-align: center;
                    color: var(--color-text-dark);
                    font-size: 13px;
                    font-weight: 500;
                    border-right: 1px solid var(--color-border);
                ">
                    ${record.applicationDate}
                </td>
                <td style="
                    padding: 10px 10px;
                    text-align: center;
                    color: ${record.nextDoseDate === "N/A"
                    ? "var(--color-gray)"
                    : "var(--color-text-dark)"
                };
                    font-size: 13px;
                    font-weight: 500;
                    border-right: 1px solid var(--color-border);
                ">
                    ${record.nextDoseDate}
                </td>
                <td style="
                    padding: 10px 10px;
                    text-align: center;
                    font-size: 13px;
                    font-weight: 600;
                ">
                    <select 
                        id="status-select-${index}"
                        style="
                            background: ${statusColor};
                            color: var(--color-text-white);
                            padding: 5px 10px;
                            border-radius: 4px;
                            font-size: 12px;
                            text-transform: uppercase;
                            border: none;
                            outline: none;
                            cursor: pointer;
                        "
                        onchange="window.reportManager.updateStatus(${index}, this.value); this.style.background = window.reportManager.getStatusColor(this.value);"
                    >
                        <option value="vencida" ${currentStatus === "vencida" ? "selected" : ""
                } style="background: #e74c3c; color: white;">Vencida</option>
                        <option value="proxima" ${currentStatus === "proxima" ? "selected" : ""
                } style="background: #f39c12; color: white;">Próxima</option>
                        <option value="vigente" ${currentStatus === "vigente" ? "selected" : ""
                } style="background: #27ae60; color: white;">Vigente</option>
                        <option value="completa" ${currentStatus === "completa" ? "selected" : ""
                } style="background: #3498db; color: white;">Completa</option>
                    </select>
                </td>
            </tr>
        `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

        tableHTML += `
        <div style="text-align: center; margin-top: 20px;">
            <button id="download-pdf-btn" class="btn-download-pdf" style="
                padding: 8px 16px;
                background-color: var(--color-success);
                color: var(--color-text-white);
                border: 1px solid var(--color-border);
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: all var(--transition-speed) ease;
            ">
                <i class="fas fa-file-pdf" style="margin-right: 6px;"></i> Descargar Reporte PDF Profesional
            </button>
        </div>
    `;

        this.previewContainer.innerHTML = tableHTML;
        this.showToast(
            "Vista previa del reporte generada exitosamente.",
            "success"
        );

        const downloadBtn = document.getElementById("download-pdf-btn");
        if (downloadBtn) {
            downloadBtn.addEventListener("click", () =>
                this.downloadPDF(this.detailedData)
            );
        }
    }
    async downloadPDF(detailedData) {
        try {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error(
                    "jsPDF no está disponible. Asegúrate de que el script de jsPDF se haya cargado."
                );
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const primaryColor = [74, 111, 165];
            const secondaryColor = [44, 62, 80];
            const accentColor = [52, 73, 94];

            let logoBase64 = null;
            try {
                logoBase64 = await this.getImageAsBase64(
                    "logos/WhatsApp Image 2024-02-21 at 4.12.44 PM.png"
                );
            } catch (error) {
                console.warn("No se pudo cargar el logo, continuando sin él");
            }

            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 50, "F");

            if (logoBase64) {
                try {
                    doc.addImage(logoBase64, "PNG", 15, 8, 35, 35);
                } catch (error) {
                    console.warn("Error al agregar logo al PDF:", error);
                }
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("CONTROL DE VACUNACIÓN", logoBase64 ? 60 : 20, 20);

            doc.setFontSize(14);
            doc.setFont("helvetica", "normal");
            doc.text("Gestión Ganadera Hacienda Hansen", logoBase64 ? 60 : 20, 28);

            doc.setFontSize(10);
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            doc.text(
                `Fecha de generación: ${formattedDate}`,
                logoBase64 ? 60 : 20,
                36
            );
            doc.text(
                `Hora: ${currentDate.toLocaleTimeString("es-ES")}`,
                logoBase64 ? 60 : 20,
                40
            );
            doc.text(`Total de registros: ${detailedData.length}`, 150, 36);
            doc.text(
                `Animales únicos: ${new Set(detailedData.map((d) => d.animalName)).size
                }`,
                150,
                40
            );

            doc.setDrawColor(...accentColor);
            doc.setLineWidth(2);
            doc.line(15, 52, 195, 52);

            let yPos = 65;
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("REGISTRO DETALLADO DE VACUNACIONES", 15, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...primaryColor);
            doc.setFillColor(248, 249, 250);
            doc.rect(15, yPos, 180, 8, "F");

            yPos += 6;
            doc.text("ANIMAL", 20, yPos);
            doc.text("VACUNA", 65, yPos);
            doc.text("FECHA APLIC.", 110, yPos);
            doc.text("PRÓXIMA DOSIS", 140, yPos);
            doc.text("ESTADO", 175, yPos);
            yPos += 5;

            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.5);
            doc.line(15, yPos, 195, yPos);
            yPos += 5;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);

            detailedData.forEach((record, index) => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(...primaryColor);
                    doc.setFillColor(248, 249, 250);
                    doc.rect(15, yPos, 180, 8, "F");
                    yPos += 6;
                    doc.text("ANIMAL", 20, yPos);
                    doc.text("VACUNA", 65, yPos);
                    doc.text("FECHA APLIC.", 110, yPos);
                    doc.text("PRÓXIMA DOSIS", 140, yPos);
                    doc.text("ESTADO", 175, yPos);
                    yPos += 5;
                    doc.line(15, yPos, 195, yPos);
                    yPos += 5;
                    doc.setFont("helvetica", "normal");
                }

                if (index % 2 === 0) {
                    doc.setFillColor(250, 251, 252);
                    doc.rect(15, yPos - 3, 180, 8, "F");
                }

                doc.setTextColor(0, 0, 0);
                const animalName = record.animalName
                    ? record.animalName.length > 20
                        ? record.animalName.substring(0, 17) + "..."
                        : record.animalName
                    : "Sin nombre";
                doc.text(animalName, 20, yPos);

                const vaccineName =
                    record.vaccineName.length > 20
                        ? record.vaccineName.substring(0, 17) + "..."
                        : record.vaccineName;
                doc.text(vaccineName, 65, yPos);

                doc.text(record.applicationDate, 110, yPos);
                doc.text(record.nextDoseDate, 140, yPos);

                const currentStatus = record.status || "completa";
                const statusColor = this.getStatusColorRGB(currentStatus);
                doc.setTextColor(...statusColor);
                doc.setFont("helvetica", "bold");
                doc.text(currentStatus.toUpperCase(), 175, yPos);
                doc.setFont("helvetica", "normal");

                yPos += 8;
            });

            yPos += 10;
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }

            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(2);
            doc.line(15, yPos, 195, yPos);
            yPos += 8;

            doc.setTextColor(...secondaryColor);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("RESUMEN ESTADÍSTICO", 15, yPos);
            yPos += 8;

            const totalAnimals = new Set(detailedData.map((d) => d.animalName)).size;
            const statusCounts = detailedData.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {});

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...accentColor);

            doc.text(`• Total de animales vacunados: ${totalAnimals}`, 20, yPos);
            yPos += 6;
            doc.text(
                `• Total de vacunaciones registradas: ${detailedData.length}`,
                20,
                yPos
            );
            yPos += 6;
            doc.text(
                `• Vacunas con estado vigente: ${statusCounts.vigente || 0}`,
                20,
                yPos
            );
            yPos += 6;
            doc.text(
                `• Vacunas próximas a vencer: ${statusCounts.proxima || 0}`,
                20,
                yPos
            );
            yPos += 6;
            doc.text(`• Vacunas vencidas: ${statusCounts.vencida || 0}`, 20, yPos);

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(...primaryColor);
                doc.setLineWidth(1);
                doc.line(15, 280, 195, 280);
                doc.setFontSize(8);
                doc.setTextColor(...accentColor);
                doc.setFont("helvetica", "normal");
                doc.text(
                    "Gestión Ganadera Hacienda Hansen - Reporte Generado Automáticamente",
                    15,
                    287
                );
                doc.text(`Página ${i} de ${pageCount}`, 170, 287);
                doc.setFontSize(6);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    "DOCUMENTO CONFIDENCIAL - CONTROL SANITARIO GANADERO",
                    15,
                    292
                );
            }

            const timestamp = new Date()
                .toISOString()
                .slice(0, 16)
                .replace("T", "_")
                .replace(/:/g, "");
            const fileName = `Control_Vacunacion_Ganadera_${timestamp}.pdf`;
            doc.save(fileName);

            this.showToast(
                `Reporte profesional ganadero descargado exitosamente: "${fileName}" - ${new Date().toLocaleString(
                    "es-ES"
                )}`,
                "success"
            );
        } catch (error) {
            this.showToast(`Error al generar el PDF: ${error.message}`, "error");
            console.error("Error en downloadPDF:", error);
        }
    }

    async generateReport() {
        console.log("Generando vista previa del reporte...");
        if (!this.reportOutput) {
            this.reportOutput = document.getElementById("report-output");
        }

        try {
            const vaccines = await this.loadAllVaccinesFromServer();
            console.log("Vacunas obtenidas:", vaccines);
            const detailedData =
                vaccines.length > 0 ? this.getDetailedVaccineData(vaccines) : [];
            console.log("Datos detallados para la vista previa:", detailedData);
            this.showPreview(detailedData);
        } catch (error) {
            this.showToast(
                `Error al generar la vista previa: ${error.message}`,
                "error"
            );
            console.error("Error en generateReport:", error);
        }
    }

    showToast(message, type = "info", options = {}) {
        const { duration = 3000, showIcon = true } = options;

        // Preparar el contenido
        let content;
        if (showIcon) {
            content = `<div class="toast-content"><span class="toast-icon"></span>${message}</div>`;
        } else {
            content = `<div class="toast-content">${message}</div>`;
            type = "no-icon";
        }

        Toastify({
            text: content,
            duration: duration,
            close: true,
            gravity: "top",
            position: "right",
            className: `toast-${type}`,
            escapeMarkup: false,
            stopOnFocus: true,
            style: {
                background: "transparent",
                boxShadow: "none",
                padding: "0",
            },
        }).showToast();
    }

    initialize() {
        const reportSection = document.getElementById("reportes");
        console.log(
            "Inicializando ReportManager, sección #reportes encontrada:",
            reportSection
        );
        if (reportSection) {
            let generateReportBtn = document.getElementById("generate-report-btn");
            if (!generateReportBtn) {
                const existingContent = reportSection.innerHTML;
                reportSection.innerHTML = `
                ${existingContent}
                <div style="text-align: center; margin: 20px 0;">
                    <button id="generate-report-btn" class="btn-generate-report" style="
                        padding: 8px 16px;
                        background-color: var(--color-primary);
                        color: var(--color-text-white);
                        border: 1px solid var(--color-border);
                        border-radius: var(--border-radius);
                        cursor: pointer;
                        transition: all var(--transition-speed) ease;
                    ">
                        <i class="fas fa-chart-line" style="margin-right: 6px;"></i> Generar Reporte Ganadero
                    </button>
                </div>
                <div id="report-preview" class="report-preview" style="margin: 20px 0;"></div>
                <div id="report-output" class="report-output" style="margin: 10px 0;"></div>
            `;
                generateReportBtn = document.getElementById("generate-report-btn");
            }

            this.reportOutput = document.getElementById("report-output");
            this.previewContainer = document.getElementById("report-preview");
            console.log("reportOutput creado:", this.reportOutput);
            console.log("previewContainer creado:", this.previewContainer);

            if (generateReportBtn) {
                let isGenerating = false; // Lock to prevent re-entry
                const debouncedGenerateReport = this.debounce(() => {
                    if (isGenerating) return; // Prevent multiple calls
                    isGenerating = true;
                    console.log("Botón de generar vista previa clickeado");
                    this.generateReport().finally(() => {
                        isGenerating = false; // Release lock after completion
                    });
                }, 500); // Increased to 500ms
                generateReportBtn.addEventListener("click", debouncedGenerateReport);
                console.log("Botón #generate-report-btn configurado con debounce");
            } else {
                console.error(
                    "Botón #generate-report-btn no encontrado después de crearlo."
                );
            }
        } else {
            console.error("Sección #reportes no encontrada.");
        }
    }
}

window.ReportManager = ReportManager;
window.reportManager = new ReportManager(window.dataManager);
