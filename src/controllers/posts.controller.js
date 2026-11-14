import { selectById as selectAuthorById } from '../models/authors.model.js';
import { selectAll, insert } from '../models/posts.model.js';

/**
 * Lista todos los posts con su autor.
 * GET /api/posts
 * @param {import('express').Request} req petición HTTP
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const getAllPosts = async (req, res) => {
  try {
    const posts = await selectAll();
    res.status(200).json(posts);
  } catch (error) {
    console.error('[posts.controller.getAllPosts]', error);
    res.status(500).json({ message: 'No se pudieron obtener los posts.' });
  }
};

/**
 * Devuelve un post por su id. El post ya viene buscado por `checkId`.
 * GET /api/posts/:id
 * @param {import('express').Request} req petición HTTP con `req.post`
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const getPostById = async (req, res) => {
  try {
    res.status(200).json(req.post);
  } catch (error) {
    console.error('[posts.controller.getPostById]', error);
    res.status(500).json({ message: 'No se pudo obtener el post.' });
  }
};

/**
 * Crea un post. Los datos inválidos o un autor inexistente responden 400.
 * POST /api/posts
 * @param {import('express').Request} req petición HTTP con el post en el body
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const createPost = async (req, res) => {
  try {
    const { titulo, descripcion, categoria, autorId } = req.body ?? {};

    // Guard clauses: se valida antes de ir a la base de datos.
    if (typeof titulo !== 'string' || titulo.trim().length < 3 || titulo.trim().length > 150) {
      return res.status(400).json({ message: 'El título debe tener entre 3 y 150 caracteres.' });
    }

    if (typeof descripcion !== 'string' || descripcion.trim().length < 10) {
      return res.status(400).json({ message: 'La descripción debe tener al menos 10 caracteres.' });
    }

    if (typeof categoria !== 'string' || categoria.trim().length < 3 || categoria.trim().length > 60) {
      return res.status(400).json({ message: 'La categoría debe tener entre 3 y 60 caracteres.' });
    }

    const numericAuthorId = Number(autorId);

    if (!Number.isInteger(numericAuthorId) || numericAuthorId <= 0) {
      return res.status(400).json({ message: 'El autorId debe ser un número entero positivo.' });
    }

    const author = await selectAuthorById(numericAuthorId);

    // Guard clause: no se crea un post de un autor que no existe.
    if (!author) {
      return res.status(400).json({ message: `No existe un autor con el id ${numericAuthorId}.` });
    }

    const post = await insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria: categoria.trim(),
      autorId: numericAuthorId,
    });

    // En clase la creación también responde 200 (el 201 no se usa).
    res.status(200).json(post);
  } catch (error) {
    console.error('[posts.controller.createPost]', error);
    res.status(500).json({ message: 'No se pudo crear el post.' });
  }
};
