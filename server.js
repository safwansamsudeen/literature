
import http from 'http';
import express from 'express';
import injectSocketIO from './socket_handler.js';
import { handler } from './build/handler.js';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Inject SocketIO
injectSocketIO(server);

// SvelteKit handlers
app.use(handler);
app.use(cors());

server.listen(3000, () => {
    console.log('Running on http://localhost:3000');
});