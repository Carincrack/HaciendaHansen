class AdminConsole {
    constructor() {
        this.adminContainer = document.getElementById('admin');
        this.socket = io('http://localhost:3000');
        this.isInitialized = false;
        this.charts = {};
        this.historicalData = {
            cpu: [],
            memory: [],
            timestamps: []
        };
        this.eventListeners = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkVisibility();

        // Limpiar al cerrar o recargar la página
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    setupEventListeners() {
        const addListener = (event, callback) => {
            const listener = this.socket.on(event, callback);
            this.eventListeners.set(event, listener);
        };

        document.addEventListener('sectionChange', (e) => {
            console.log('Evento sectionChange recibido:', e.detail.section);
            this.checkVisibility(e.detail.section);
        });

        addListener('systemStats', (stats) => {
            console.log('Datos del sistema recibidos:', stats);
            if (this.adminContainer.style.display !== 'none' && this.isInitialized) {
                this.updateSystemStats(stats);
            }
        });

        addListener('processInfo', (processes) => {
            console.log('Información de procesos recibida:', processes);
            if (this.adminContainer.style.display !== 'none' && this.isInitialized) {
                this.updateProcessList(processes);
            }
        });

        addListener('serverLogs', (log) => {
            console.log('Log del servidor:', log);
            if (this.adminContainer.style.display !== 'none' && this.isInitialized) {
                this.addLogEntry(log);
            }
        });

        addListener('networkStats', (netStats) => {
            console.log('Estadísticas de red:', netStats);
            if (this.adminContainer.style.display !== 'none' && this.isInitialized) {
                this.updateNetworkStats(netStats);
            }
        });

        addListener('diskUsage', (diskInfo) => {
            console.log('Uso de disco:', diskInfo);
            if (this.adminContainer.style.display !== 'none' && this.isInitialized) {
                this.updateDiskUsage(diskInfo);
            }
        });

        addListener('connectedUsers', (users) => {
            console.log('Usuarios conectados:', users);
            if (this.adminContainer.style.display !== 'none' && this.isInitialized) {
                this.updateConnectedUsers(users);
            }
        });

        addListener('systemError', (error) => {
            console.error('Error del sistema:', error);
            if (this.adminContainer.style.display !== 'none' && this.isInitialized) {
                this.addErrorLog(error);
            }
        });
    }

    checkVisibility(activeSection = null) {
        const currentSection = activeSection || document.querySelector('.section.active')?.id;
        console.log('Verificando sección activa:', currentSection);
        if (currentSection === 'admin') {
            if (!this.isInitialized) {
                this.setupUI();
                this.isInitialized = true;
                console.log('Interfaz de admin inicializada');
                this.socket.emit('startMonitoring'); // Iniciar monitoreo al entrar
            }
            this.adminContainer.style.display = 'block';
        } else {
            this.socket.emit('stopMonitoring'); // Detener monitoreo al salir
            this.adminContainer.style.display = 'none';
        }
    }

    requestInitialData() {
        this.socket.emit('requestSystemStats');
        this.socket.emit('requestProcessInfo');
        this.socket.emit('requestNetworkStats');
        this.socket.emit('requestDiskUsage');
        this.socket.emit('requestConnectedUsers');
    }

    setupUI() {
        this.adminContainer.innerHTML = `
            <div class="admin-sys-panel">
                <div class="admin-sys-header">
                    <h2 class="admin-sys-title">Panel de Administración del Sistema</h2>
                    <div class="admin-sys-status">
                        <span class="admin-sys-status-indicator admin-sys-online"></span>
                        <span class="admin-sys-status-text">Sistema Operativo</span>
                    </div>
                </div>

                <div class="admin-sys-grid">
                    <!-- Estadísticas del Sistema -->
                    <div class="admin-sys-card admin-sys-card-wide">
                        <div class="admin-sys-card-header">
                            <h3 class="admin-sys-card-title">Recursos del Sistema</h3>
                        </div>
                        <div class="admin-sys-stats-grid">
                            <div class="admin-sys-stat-item">
                                <div class="admin-sys-stat-label">CPU</div>
                                <div class="admin-sys-stat-value" id="admin-sys-cpu">0%</div>
                                <div class="admin-sys-progress-bar">
                                    <div class="admin-sys-progress-fill" id="admin-sys-cpu-bar"></div>
                                </div>
                            </div>
                            <div class="admin-sys-stat-item">
                                <div class="admin-sys-stat-label">Memoria</div>
                                <div class="admin-sys-stat-value" id="admin-sys-memory">0%</div>
                                <div class="admin-sys-progress-bar">
                                    <div class="admin-sys-progress-fill" id="admin-sys-memory-bar"></div>
                                </div>
                            </div>
                            <div class="admin-sys-stat-item">
                                <div class="admin-sys-stat-label">Memoria Total</div>
                                <div class="admin-sys-stat-value" id="admin-sys-total-memory">0 GB</div>
                            </div>
                            <div class="admin-sys-stat-item">
                                <div class="admin-sys-stat-label">Memoria Libre</div>
                                <div class="admin-sys-stat-value" id="admin-sys-free-memory">0 GB</div>
                            </div>
                        </div>
                    </div>

                    <!-- Información de Red -->
                    <div class="admin-sys-card">
                        <div class="admin-sys-card-header">
                            <h3 class="admin-sys-card-title">Estadísticas de Red</h3>
                        </div>
                        <div class="admin-sys-network-stats">
                            <div class="admin-sys-network-item">
                                <span class="admin-sys-network-label">RX:</span>
                                <span class="admin-sys-network-value" id="admin-sys-rx">0 KB/s</span>
                            </div>
                            <div class="admin-sys-network-item">
                                <span class="admin-sys-network-label">TX:</span>
                                <span class="admin-sys-network-value" id="admin-sys-tx">0 KB/s</span>
                            </div>
                            <div class="admin-sys-network-item">
                                <span class="admin-sys-network-label">Latencia:</span>
                                <span class="admin-sys-network-value" id="admin-sys-latency">0 ms</span>
                            </div>
                        </div>
                    </div>

                    <!-- Uso de Disco -->
                    <div class="admin-sys-card">
                        <div class="admin-sys-card-header">
                            <h3 class="admin-sys-card-title">Almacenamiento</h3>
                        </div>
                        <div class="admin-sys-disk-list" id="admin-sys-disk-list">
                            <div class="admin-sys-loading">Cargando...</div>
                        </div>
                    </div>

                    <!-- Usuarios Conectados -->
                    <div class="admin-sys-card">
                        <div class="admin-sys-card-header">
                            <h3 class="admin-sys-card-title">Usuarios Conectados</h3>
                            <span class="admin-sys-user-count" id="admin-sys-user-count">0</span>
                        </div>
                        <div class="admin-sys-user-list" id="admin-sys-user-list">
                            <div class="admin-sys-loading">Cargando...</div>
                        </div>
                    </div>

                    <!-- Procesos Activos -->
                    <div class="admin-sys-card admin-sys-card-wide">
                        <div class="admin-sys-card-header">
                            <h3 class="admin-sys-card-title">Procesos del Sistema</h3>
                        </div>
                        <div class="admin-sys-process-table">
                            <div class="admin-sys-table-header">
                                <div class="admin-sys-table-cell">PID</div>
                                <div class="admin-sys-table-cell">Nombre</div>
                                <div class="admin-sys-table-cell">CPU</div>
                                <div class="admin-sys-table-cell">Memoria</div>
                            </div>
                            <div class="admin-sys-table-body" id="admin-sys-process-list">
                                <div class="admin-sys-loading">Cargando procesos...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Consola de Logs -->
                    <div class="admin-sys-card admin-sys-card-wide">
                        <div class="admin-sys-card-header">
                            <h3 class="admin-sys-card-title">Logs del Sistema</h3>
                            <button class="admin-sys-btn admin-sys-btn-clear" onclick="this.parentNode.parentNode.querySelector('#admin-sys-console-log').innerHTML = ''">Limpiar</button>
                        </div>
                        <div class="admin-sys-console">
                            <div class="admin-sys-console-log" id="admin-sys-console-log"></div>
                        </div>
                    </div>
                </div>

                <div class="admin-sys-footer">
                    <div class="admin-sys-timestamp">
                        Última actualización: <span id="admin-sys-timestamp">--</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateSystemStats(stats) {
        document.getElementById('admin-sys-cpu').textContent = stats.cpuUsage || '0%';
        document.getElementById('admin-sys-memory').textContent = stats.memoryUsage || '0%';
        document.getElementById('admin-sys-total-memory').textContent = stats.totalMemory || '0 GB';
        document.getElementById('admin-sys-free-memory').textContent = stats.freeMemory || '0 GB';
        document.getElementById('admin-sys-timestamp').textContent = stats.timestamp || new Date().toLocaleString();

        const cpuPercent = parseFloat(stats.cpuUsage) || 0;
        const memoryPercent = parseFloat(stats.memoryUsage) || 0;
        
        document.getElementById('admin-sys-cpu-bar').style.width = cpuPercent + '%';
        document.getElementById('admin-sys-memory-bar').style.width = memoryPercent + '%';

        this.updateProgressBarColor('admin-sys-cpu-bar', cpuPercent);
        this.updateProgressBarColor('admin-sys-memory-bar', memoryPercent);
    }

    updateProgressBarColor(elementId, percent) {
        const element = document.getElementById(elementId);
        if (percent > 80) {
            element.className = 'admin-sys-progress-fill admin-sys-critical';
        } else if (percent > 60) {
            element.className = 'admin-sys-progress-fill admin-sys-warning';
        } else {
            element.className = 'admin-sys-progress-fill admin-sys-normal';
        }
    }

    updateProcessList(processes) {
        const processList = document.getElementById('admin-sys-process-list');
        if (!processes || processes.length === 0) {
            processList.innerHTML = '<div class="admin-sys-no-data">No hay procesos disponibles</div>';
            return;
        }
        processList.innerHTML = processes.slice(0, 10).map(proc => `
            <div class="admin-sys-table-row">
                <div class="admin-sys-table-cell">${proc.pid}</div>
                <div class="admin-sys-table-cell">${proc.name}</div>
                <div class="admin-sys-table-cell">${proc.cpu}</div>
                <div class="admin-sys-table-cell">${proc.memory}</div>
            </div>
        `).join('');
    }

    updateNetworkStats(netStats) {
        document.getElementById('admin-sys-rx').textContent = netStats.rx || '0 KB/s';
        document.getElementById('admin-sys-tx').textContent = netStats.tx || '0 KB/s';
        document.getElementById('admin-sys-latency').textContent = netStats.latency || '0 ms';
    }

    updateDiskUsage(diskInfo) {
        const diskList = document.getElementById('admin-sys-disk-list');
        if (!diskInfo || diskInfo.length === 0) {
            diskList.innerHTML = '<div class="admin-sys-no-data">No hay información de disco</div>';
            return;
        }
        diskList.innerHTML = diskInfo.map(disk => `
            <div class="admin-sys-disk-item">
                <div class="admin-sys-disk-name">${disk.filesystem}</div>
                <div class="admin-sys-disk-usage">
                    <div class="admin-sys-disk-bar">
                        <div class="admin-sys-disk-fill" style="width: ${disk.use}%"></div>
                    </div>
                    <span class="admin-sys-disk-percent">${disk.use}%</span>
                </div>
                <div class="admin-sys-disk-size">${disk.size}</div>
            </div>
        `).join('');
    }

    updateConnectedUsers(users) {
        const userList = document.getElementById('admin-sys-user-list');
        const userCount = document.getElementById('admin-sys-user-count');
        userCount.textContent = users.length;
        if (!users || users.length === 0) {
            userList.innerHTML = '<div class="admin-sys-no-data">No hay usuarios conectados</div>';
            return;
        }
        userList.innerHTML = users.map(user => `
            <div class="admin-sys-user-item">
                <div class="admin-sys-user-avatar"></div>
                <div class="admin-sys-user-info">
                    <div class="admin-sys-user-name">${user.name || 'Usuario'}</div>
                    <div class="admin-sys-user-ip">${user.ip}</div>
                </div>
                <div class="admin-sys-user-time">${user.connectedTime || '0m'}</div>
            </div>
        `).join('');
    }

    addLogEntry(log) {
        const consoleLog = document.getElementById('admin-sys-console-log');
        const logEntry = document.createElement('div');
        logEntry.className = `admin-sys-log-entry admin-sys-log-${log.level || 'info'}`;
        logEntry.innerHTML = `
            <span class="admin-sys-log-timestamp">[${log.timestamp || new Date().toLocaleTimeString()}]</span>
            <span class="admin-sys-log-level">${log.level || 'INFO'}</span>
            <span class="admin-sys-log-message">${log.message}</span>
        `;
        consoleLog.appendChild(logEntry);
        if (consoleLog.children.length > 50) consoleLog.removeChild(consoleLog.firstChild);
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    addErrorLog(error) {
        this.addLogEntry({
            level: 'error',
            message: error.message || error,
            timestamp: new Date().toLocaleTimeString()
        });
    }

    cleanup() {
        this.socket.emit('stopMonitoring');
        this.eventListeners.forEach((listener, event) => {
            this.socket.off(event, listener);
        });
        this.eventListeners.clear();
        this.socket.disconnect();
        console.log('Conexión WebSocket y listeners limpiados');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.adminConsoleInstance) {
        window.adminConsoleInstance = new AdminConsole();
    }
    console.log('AdminConsole inicializado');
});