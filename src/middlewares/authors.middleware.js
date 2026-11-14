import { selectById, selectByName } from '../models/authors.model.js';

/**
 * Comprueba que el autor del `req.params.id` exista.
 * Si existe lo deja en `req.author`; si no, responde 404 con un mensaje.
 * @param {import('express').Request} req petición HTTP
 * @param {import('express').Response} res respuesta HTTP
 * @param {import('express').NextFunction} next siguiente middleware
 * @returns {Promise<void>}
 */
export const checkAuthorId = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // el id tiene que ser un entero positivo.
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: `El id "${req.params.id}" no es válido. Debe ser un número entero positivo.`,
      });
    }

    const author = await selectById(id);

    // si no existe, se responde y no se sigue.
    if (!author) {
      return res.status(404).json({ message: `No existe un autor con el id ${id}.` });
    }

    req.author = author;
    next();
  } catch (error) {
    console.error('[authors.middleware.checkAuthorId]', error);
    res.status(500).json({ message: 'No se pudo comprobar el autor.' });
  }
};


