// Creación y configuración del servidor
import http from 'node:http';
import app from './src/app.js';

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

server.listen(PORT);
server.on('listening', () => {
  console.log(`Server listening on port ${PORT}`);
});
server.on('error', (error) => {
  console.log(error);
});
