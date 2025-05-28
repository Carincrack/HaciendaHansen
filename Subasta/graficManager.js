// Initialize DataManager
const dataManager = new window.DataManager();

// Function to get current theme (fallback to localStorage or default)
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'default'; // Adjust based on your theme selection logic
}

// Function to initialize charts
async function initCharts() {
    const produccionDiv = document.getElementById('produccion');
    if (!produccionDiv) {
        console.error('Elemento #produccion no encontrado');
        return;
    }

    // Show loading message
    produccionDiv.innerHTML = '<p class="loading-message">Cargando datos...</p>';

    try {
        // Load data using DataManager
        await dataManager.loadInitialData();
        const animals = dataManager.getAnimals() || [];
        const vaccines = dataManager.getVaccines() || [];

        // Clear loading message
        produccionDiv.innerHTML = '';

        if (animals.length === 0 && vaccines.length === 0) {
            produccionDiv.innerHTML = '<p class="error-message">No hay datos disponibles para mostrar.</p>';
            return;
        }

        // Determine title color based on theme
        const currentTheme = getCurrentTheme();
        const titleColor = currentTheme === 'night' ? '#ffff' : '#000000';

        // Pie Chart: Animals by Weight Category with expanded ranges
        const weightPieContainer = document.createElement('div');
        weightPieContainer.className = 'chart-container';
        weightPieContainer.innerHTML = '<canvas id="weightPieChart"></canvas>';
        produccionDiv.appendChild(weightPieContainer);

        const weightCategories = {
            '<50kg': animals.filter(a => a.weight && a.weight < 50).length,
            '50-100kg': animals.filter(a => a.weight && a.weight >= 50 && a.weight <= 100).length,
            '100-150kg': animals.filter(a => a.weight && a.weight > 100 && a.weight <= 150).length,
            '150-200kg': animals.filter(a => a.weight && a.weight > 150 && a.weight <= 200).length,
            '200-250kg': animals.filter(a => a.weight && a.weight > 200 && a.weight <= 250).length,
            '250-300kg': animals.filter(a => a.weight && a.weight > 250 && a.weight <= 300).length,
            '300-350kg': animals.filter(a => a.weight && a.weight > 300 && a.weight <= 350).length,
            '350-400kg': animals.filter(a => a.weight && a.weight > 350 && a.weight <= 400).length,
            '400-450kg': animals.filter(a => a.weight && a.weight > 400 && a.weight <= 450).length,
            '450-500kg': animals.filter(a => a.weight && a.weight > 450 && a.weight <= 500).length,
            '500-550kg': animals.filter(a => a.weight && a.weight > 500 && a.weight <= 550).length,
            '550-600kg': animals.filter(a => a.weight && a.weight > 550 && a.weight <= 600).length,
            '600-650kg': animals.filter(a => a.weight && a.weight > 600 && a.weight <= 650).length,
            '650-700kg': animals.filter(a => a.weight && a.weight > 650 && a.weight <= 700).length,
            '700-750kg': animals.filter(a => a.weight && a.weight > 700 && a.weight <= 750).length,
            '750-800kg': animals.filter(a => a.weight && a.weight > 750 && a.weight <= 800).length,
            '800-850kg': animals.filter(a => a.weight && a.weight > 800 && a.weight <= 850).length,
            '850-900kg': animals.filter(a => a.weight && a.weight > 850 && a.weight <= 900).length,
            '900-950kg': animals.filter(a => a.weight && a.weight > 900 && a.weight <= 950).length,
            '950-1000kg': animals.filter(a => a.weight && a.weight > 950 && a.weight <= 1000).length,
            '>1000kg': animals.filter(a => a.weight && a.weight > 1000).length
        };
        const filteredLabels = Object.keys(weightCategories).filter(label => weightCategories[label] > 0);
        const filteredData = Object.values(weightCategories).filter(count => count > 0);
        const weightChart = new Chart(document.getElementById('weightPieChart'), {
            type: 'pie',
            data: {
                labels: filteredLabels,
                datasets: [{
                    data: filteredData,
                    backgroundColor: [
                        '#1abc9c', '#e74c3c', '#3498db', '#9b59b6', '#f1c40f',
                        '#2ecc71', '#e67e22', '#8e44ad', '#16a085', '#d35400',
                        '#27ae60', '#c0392b', '#2980b9', '#8e44ad', '#f39c12',
                        '#1abc9c', '#e74c3c', '#3498db', '#9b59b6', '#f1c40f',
                        '#2ecc71'
                    ].slice(0, filteredLabels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Animales por Peso',
                        font: { size: 22, weight: 'bold' },
                        color: titleColor, // White for night, black for others
                        padding: { bottom: 20 }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 15 },
                            boxWidth: 25,
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#34495e',
                        titleFont: { size: 15 },
                        bodyFont: { size: 13 },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw} animales`
                        }
                    }
                }
            }
        });

        // Doughnut Chart: Vaccines by Type
        const vaccineDoughnutContainer = document.createElement('div');
        vaccineDoughnutContainer.className = 'chart-container';
        vaccineDoughnutContainer.innerHTML = '<canvas id="vaccineDoughnutChart"></canvas>';
        produccionDiv.appendChild(vaccineDoughnutContainer);

        const vaccineCounts = {};
        vaccines.forEach(v => {
            if (v.name) vaccineCounts[v.name] = (vaccineCounts[v.name] || 0) + 1;
        });
        const vaccineData = Object.keys(vaccineCounts).map(type => ({
            type: type,
            count: vaccineCounts[type]
        }));
        const vaccineChart = new Chart(document.getElementById('vaccineDoughnutChart'), {
            type: 'doughnut',
            data: {
                labels: vaccineData.map(v => v.type),
                datasets: [{
                    data: vaccineData.map(v => v.count),
                    backgroundColor: ['#1abc9c', '#e74c3c', '#3498db', '#9b59b6', '#f1c40f'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Vacunas por Tipo',
                        font: { size: 22, weight: 'bold' },
                        color: titleColor, // White for night, black for others
                        padding: { bottom: 20 }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 15 },
                            boxWidth: 25,
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#34495e',
                        titleFont: { size: 15 },
                        bodyFont: { size: 13 },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw} dosis`
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error al inicializar gráficos:', error);
        produccionDiv.innerHTML = '<p class="error-message">Error al cargar los datos. Por favor, intenta de nuevo más tarde.</p>';
    }
}

// Load Chart.js from CDN and initialize charts when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = initCharts;
    script.onerror = () => {
        console.error('Error al cargar Chart.js');
        const produccionDiv = document.getElementById('produccion');
        if (produccionDiv) {
            produccionDiv.innerHTML = '<p class="error-message">Error al cargar la librería de gráficos.</p>';
        }
    };
    document.head.appendChild(script);
});