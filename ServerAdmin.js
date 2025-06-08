const os = require('os');
const si = require('systeminformation');

class ServerAdmin {
    constructor(io) {
        this.io = io;
        this.init();
    }

    async init() {
        this.io.on('connection', async (socket) => {
            console.log('Cliente de administración conectado');

            // Enviar estadísticas del sistema cada 2 segundos
            const sendSystemStats = async () => {
                const system = await si.system();
                const mem = await si.mem();
                const currentLoad = await si.currentLoad();

                const totalMemory = mem.total;
                const freeMemory = mem.free;
                const usedMemory = totalMemory - freeMemory;
                const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(2);

                const cpuUsage = currentLoad.currentLoad.toFixed(2);

                socket.emit('systemStats', {
                    cpuUsage: cpuUsage + '%',
                    memoryUsage: memoryUsage + '%',
                    totalMemory: (totalMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    freeMemory: (freeMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    timestamp: new Date().toLocaleTimeString()
                });
            };

            // Enviar información de procesos cada 5 segundos
            const sendProcessInfo = async () => {
                const processes = await si.processes();
                const processList = processes.list.slice(0, 10).map(p => ({
                    pid: p.pid,
                    name: p.name || 'Unknown',
                    cpu: p.pcpu ? p.pcpu.toFixed(2) + '%' : '0%',
                    memory: p.mem ? (p.mem / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'
                }));
                socket.emit('processInfo', processList);
            };

            // Enviar logs simulados cada 3 segundos (puedes reemplazar con logs reales si los tienes)
            const sendServerLogs = () => {
                const mockLogs = {
                    level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
                    message: `Log generado a las ${new Date().toLocaleTimeString()}`,
                    timestamp: new Date().toLocaleTimeString()
                };
                socket.emit('serverLogs', mockLogs);
            };

            // Enviar estadísticas de red cada 4 segundos
            const sendNetworkStats = async () => {
                const networkStats = await si.networkStats();
                const iface = networkStats[0] || { rx_bytes: 0, tx_bytes: 0, ms: 0 };
                socket.emit('networkStats', {
                    rx: (iface.rx_bytes / 1024).toFixed(2) + ' KB/s',
                    tx: (iface.tx_bytes / 1024).toFixed(2) + ' KB/s',
                    latency: (Math.random() * 50).toFixed(2) + ' ms' // Simulado, usa un módulo real si disponible
                });
            };

            // Enviar uso de disco cada 6 segundos
            const sendDiskUsage = async () => {
                const disks = await si.fsSize();
                socket.emit('diskUsage', disks.map(d => ({
                    filesystem: d.fs,
                    size: (d.size / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    use: (d.use / d.size * 100).toFixed(2)
                })));
            };

            // Enviar usuarios conectados cada 7 segundos (simulado, usa un sistema de autenticación real si lo tienes)
            const sendConnectedUsers = async () => {
                const users = await si.users();
                const mockUsers = users.map(u => ({
                    name: u.user || `Usuario${u.uid}`,
                    ip: u.ip || `192.168.1.${Math.floor(Math.random() * 255)}`,
                    connectedTime: `${Math.floor(Math.random() * 60)}m`
                }));
                socket.emit('connectedUsers', mockUsers);
            };

            // Enviar errores del sistema (simulado con 10% de probabilidad)
            const sendSystemError = () => {
                if (Math.random() < 0.1) {
                    socket.emit('systemError', {
                        message: `Error simulado: ${Math.random().toString(36).substring(7)}`,
                        timestamp: new Date().toLocaleTimeString()
                    });
                }
            };

            // Solicitudes iniciales
            socket.on('requestSystemStats', sendSystemStats);
            socket.on('requestProcessInfo', sendProcessInfo);
            socket.on('requestNetworkStats', sendNetworkStats);
            socket.on('requestDiskUsage', sendDiskUsage);
            socket.on('requestConnectedUsers', sendConnectedUsers);

            // Enviar datos iniciales
            await sendSystemStats();
            await sendProcessInfo();
            await sendNetworkStats();
            await sendDiskUsage();
            await sendConnectedUsers();

            // Intervalos de actualización
            setInterval(sendSystemStats, 2000);
            setInterval(sendProcessInfo, 5000);
            setInterval(sendServerLogs, 3000);
            setInterval(sendNetworkStats, 4000);
            setInterval(sendDiskUsage, 6000);
            setInterval(sendConnectedUsers, 7000);
            setInterval(sendSystemError, 10000);

            socket.on('disconnect', () => {
                console.log('Cliente de administración desconectado');
            });
        });
    }
}

module.exports = ServerAdmin;