import express from 'express';
import cors from 'cors';
import { logger } from './middlewares/logger.middleware.js';
import apiRouter from './routes/api.routes.js';

const app = express();

// El logger va antes que las rutas para registrar todas las peticiones.
app.use(logger);
app.use(express.json());
app.use(cors());

// Árbol de rutas: index.js -> app.js -> /api -> api.routes.js -> un router por recurso.
app.use('/api', apiRouter);

// Cualquier otra ruta responde 404 con un mensaje, nunca con un cuerpo vacío.
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Cualquier error no atrapado responde 500 con un mensaje, nunca con un cuerpo vacío.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

// app.js construye la app y la exporta; no llama a listen. Eso es trabajo de index.js.
export default app;
