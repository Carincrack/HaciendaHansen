const si = require('systeminformation');

class ServerAdmin {
    constructor(io) {
        this.io = io;
        this.clientStates = new Map(); // { [socket.id]: { intervals: {}, active: boolean } }
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log(`Cliente conectado: ${socket.id}`);
            this.clientStates.set(socket.id, { active: false, intervals: {} });

            socket.on('startMonitoring', async () => {
                if (this.clientStates.get(socket.id).active) return;

                console.log(`Iniciando monitoreo para: ${socket.id}`);
                this.clientStates.get(socket.id).active = true;

                try {
                    await this.sendAllData(socket);

                    const intervals = {
                        systemStats: setInterval(() => this.sendSystemStats(socket), 5000),
                        processInfo: setInterval(() => this.sendProcessInfo(socket), 10000),
                        serverLogs: setInterval(() => this.sendServerLogs(socket), 5000),
                        networkStats: setInterval(() => this.sendNetworkStats(socket), 10000),
                        diskUsage: setInterval(() => this.sendDiskUsage(socket), 30000),
                        connectedUsers: setInterval(() => this.sendConnectedUsers(socket), 30000),
                        systemError: setInterval(() => this.sendSystemError(socket), 30000)
                    };

                    this.clientStates.get(socket.id).intervals = intervals;
                } catch (e) {
                    console.error(`Error al iniciar monitoreo para ${socket.id}:`, e);
                }
            });

            socket.on('stopMonitoring', () => {
                console.log(`Deteniendo monitoreo para: ${socket.id}`);
                this.clearClientIntervals(socket.id);
            });

            socket.on('disconnect', () => {
                console.log(`Cliente desconectado: ${socket.id}`);
                this.clearClientIntervals(socket.id);
                this.clientStates.delete(socket.id);
            });
        });
    }

    clearClientIntervals(socketId) {
        const state = this.clientStates.get(socketId);
        if (state && state.intervals) {
            Object.values(state.intervals).forEach(clearInterval);
            state.intervals = {};
        }
        if (state) state.active = false;
    }

    async sendAllData(socket) {
        try {
            await Promise.all([
                this.sendSystemStats(socket),
                this.sendProcessInfo(socket),
                this.sendNetworkStats(socket),
                this.sendDiskUsage(socket),
                this.sendConnectedUsers(socket)
            ]);
        } catch (e) {
            console.error('Error en sendAllData:', e);
        }
    }

    async sendSystemStats(socket) {
        try {
            const mem = await si.mem();
            const load = await si.currentLoad();
            socket.emit('systemStats', {
                cpuUsage: load.currentLoad.toFixed(2) + '%',
                memoryUsage: ((1 - mem.free / mem.total) * 100).toFixed(2) + '%',
                totalMemory: (mem.total / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                freeMemory: (mem.free / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                timestamp: new Date().toLocaleTimeString()
            });
        } catch (e) {
            console.error('Error systemStats:', e);
        }
    }

    async sendProcessInfo(socket) {
        try {
            const proc = await si.processes();
            socket.emit('processInfo', proc.list.slice(0, 10).map(p => ({
                pid: p.pid,
                name: p.name || 'Unknown',
                cpu: p.pcpu?.toFixed(2) + '%' || '0%',
                memory: p.mem ? (p.mem / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'
            })));
        } catch (e) {
            console.error('Error processInfo:', e);
        }
    }

    async sendNetworkStats(socket) {
        try {
            const net = await si.networkStats();
            const iface = net[0] || {};
            socket.emit('networkStats', {
                rx: (iface.rx_bytes / 1024).toFixed(2) + ' KB/s',
                tx: (iface.tx_bytes / 1024).toFixed(2) + ' KB/s',
                latency: (Math.random() * 50).toFixed(2) + ' ms'
            });
        } catch (e) {
            console.error('Error networkStats:', e);
        }
    }

    async sendDiskUsage(socket) {
        try {
            const disks = await si.fsSize();
            socket.emit('diskUsage', disks.map(d => ({
                filesystem: d.fs,
                size: (d.size / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                use: (d.use / d.size * 100).toFixed(2)
            })));
        } catch (e) {
            console.error('Error diskUsage:', e);
        }
    }

    async sendConnectedUsers(socket) {
        try {
            const users = await si.users();
            socket.emit('connectedUsers', users.map(u => ({
                name: u.user || `User${u.uid}`,
                ip: u.ip || `192.168.0.${Math.floor(Math.random() * 255)}`,
                connectedTime: `${Math.floor(Math.random() * 60)}m`
            })));
        } catch (e) {
            console.error('Error connectedUsers:', e);
        }
    }

    sendServerLogs(socket) {
        try {
            socket.emit('serverLogs', {
                level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
                message: `Log generado a las ${new Date().toLocaleTimeString()}`,
                timestamp: new Date().toLocaleTimeString()
            });
        } catch (e) {
            console.error('Error serverLogs:', e);
        }
    }

    sendSystemError(socket) {
        try {
            if (Math.random() < 0.1) {
                socket.emit('systemError', {
                    message: `Error simulado: ${Math.random().toString(36).substring(7)}`,
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        } catch (e) {
            console.error('Error systemError:', e);
        }
    }
}

module.exports = ServerAdmin;