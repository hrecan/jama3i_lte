const logger = require('./logger');
const ports = require('../config/ports');

class ServerManager {
    constructor(app) {
        this.app = app;
        this.currentPort = ports.main;
        this.server = null;
    }

    async start() {
        try {
            await this.startOnPort(this.currentPort);
        } catch (error) {
            if (error.code === 'EADDRINUSE') {
                await this.tryAlternativePorts();
            } else {
                throw error;
            }
        }
    }

    async startOnPort(port) {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(port, () => {
                    logger.info(`Serveur démarré sur le port ${port}`);
                    resolve();
                });

                this.server.on('error', (error) => {
                    reject(error);
                });

                this.setupGracefulShutdown();
            } catch (error) {
                reject(error);
            }
        });
    }

    async tryAlternativePorts() {
        for (const port of ports.alternatives) {
            try {
                logger.info(`Tentative de démarrage sur le port alternatif ${port}`);
                await this.startOnPort(port);
                return;
            } catch (error) {
                if (error.code !== 'EADDRINUSE') {
                    throw error;
                }
            }
        }
        throw new Error('Aucun port disponible');
    }

    setupGracefulShutdown() {
        process.on('SIGTERM', this.shutdown.bind(this));
        process.on('SIGINT', this.shutdown.bind(this));
    }

    async shutdown(signal) {
        logger.info(`Signal ${signal} reçu. Arrêt gracieux du serveur...`);
        
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => {
                    logger.info('Serveur arrêté avec succès');
                    resolve();
                });
            });
        }
        
        process.exit(0);
    }
}

module.exports = ServerManager; 