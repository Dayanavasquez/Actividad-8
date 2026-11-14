import { selectById } from '../models/posts.model.js';

/**
 * Comprueba que el post del `req.params.id` exista.
 * Si existe lo deja en `req.post`; si no, responde 404 con un mensaje.
 * @param {import('express').Request} req petición HTTP
 * @param {import('express').Response} res respuesta HTTP
 * @param {import('express').NextFunction} next siguiente middleware
 * @returns {Promise<void>}
 */
export const checkId = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // el id tiene que ser un entero positivo.
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: `El id "${req.params.id}" no es válido. Debe ser un número entero positivo.`,
      });
    }

    const post = await selectById(id);

    // si no existe, se responde y no se sigue.
    if (!post) {
      return res.status(404).json({ message: `No existe un post con el id ${id}.` });
    }

    req.post = post;
    next();
  } catch (error) {
    console.error('[posts.middleware.checkId]', error);
    res.status(500).json({ message: 'No se pudo comprobar el post.' });
  }
};

export default checkId;
