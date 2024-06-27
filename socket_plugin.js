// webSocketPluginVite.js 
import injectSocketIO from './socket_handler.js';

export const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server) {
        injectSocketIO(server.httpServer);
    }
};