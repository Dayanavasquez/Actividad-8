import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dayjs from 'dayjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(currentDir, '..', '..', 'logs');
const logFile = path.join(logsDir, 'main.log');

// La carpeta de logs se crea al cargar el módulo si no existe (clon nuevo, alguien
// la borró). Sin esto, el primer `appendFileSync` lanzaría ENOENT y el logger
// tumbaría con un 500 una petición que estaba perfecta.
fs.mkdirSync(logsDir, { recursive: true });

/**
 * Middleware de peticiones: muestra por consola y guarda en logs/main.log
 * una línea con la fecha, el método y la ruta pedida.
 * @param {import('express').Request} req petición HTTP
 * @param {import('express').Response} res respuesta HTTP
 * @param {import('express').NextFunction} next siguiente middleware
 * @returns {void}
 */
export const logger = (req, res, next) => {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const line = `[${timestamp}] ${req.method} ${req.originalUrl}`;

  console.log(line);

  // appendFileSync a propósito: la línea queda escrita antes de que la petición
  // siga, así un `tail` inmediato siempre la encuentra. Es un log de desarrollo.
  fs.appendFileSync(logFile, `${line}\n`);

  next();
};

export default logger;
