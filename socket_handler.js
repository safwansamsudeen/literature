// socketIoHandler.js
import { Server } from 'socket.io';

export default function injectSocketIO(server) {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        let username = `User ${Math.round(Math.random() * 999999)}`;
        socket.emit('name', username);

        socket.on('message', (message) => {
            io.emit('message', {
                from: username,
                message: message,
                time: new Date().toLocaleString()
            });
        });
    });

    console.log('SocketIO injected');
}
