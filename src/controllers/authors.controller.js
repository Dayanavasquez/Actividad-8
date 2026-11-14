import { selectAll, selectByEmail, insert } from '../models/authors.model.js';
import { selectByAuthorId } from '../models/posts.model.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lista todos los autores.
 * GET /api/authors
 * @param {import('express').Request} req petición HTTP
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const getAllAuthors = async (req, res) => {
  try {
    const authors = await selectAll();
    res.status(200).json(authors);
  } catch (error) {
    console.error('[authors.controller.getAllAuthors]', error);
    res.status(500).json({ message: 'No se pudieron obtener los autores.' });
  }
};

/**
 * Devuelve un autor por su id. El autor ya viene buscado por `checkId`.
 * GET /api/authors/:id
 * @param {import('express').Request} req petición HTTP con `req.author`
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const getAuthorById = async (req, res) => {
  try {
    res.status(200).json(req.author);
  } catch (error) {
    console.error('[authors.controller.getAuthorById]', error);
    res.status(500).json({ message: 'No se pudo obtener el autor.' });
  }
};

/**
 * Lista los posts de un autor. El autor ya viene buscado por `checkId`.
 * GET /api/authors/:id/posts
 * @param {import('express').Request} req petición HTTP con `req.author`
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const getPostsByAuthor = async (req, res) => {
  try {
    const posts = await selectByAuthorId(req.author.id);
    res.status(200).json(posts);
  } catch (error) {
    console.error('[authors.controller.getPostsByAuthor]', error);
    res.status(500).json({ message: 'No se pudieron obtener los posts del autor.' });
  }
};

/**
 * Crea un autor. Los datos inválidos o el email repetido responden 400
 * (en clase el error del cliente es 400, el 5xx queda para nosotros).
 * POST /api/authors
 * @param {import('express').Request} req petición HTTP con el autor en el body
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const createAuthor = async (req, res) => {
  try {
    const { nombre, email, imagen } = req.body ?? {};

    // Guard clauses: primero se valida, después se toca la base de datos.
    if (typeof nombre !== 'string' || nombre.trim().length < 3 || nombre.trim().length > 100) {
      return res.status(400).json({ message: 'El nombre debe tener entre 3 y 100 caracteres.' });
    }

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 150) {
      return res.status(400).json({ message: 'El email no es válido (máximo 150 caracteres).' });
    }

    const normalizedImage = imagen === undefined || imagen === null || String(imagen).trim() === ''
      ? null
      : String(imagen).trim();

    if (normalizedImage !== null && normalizedImage.length > 500) {
      return res.status(400).json({ message: 'La URL de la imagen no puede superar 500 caracteres.' });
    }

    const author = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      imagen: normalizedImage,
    };

    const existingAuthor = await selectByEmail(author.email);

    if (existingAuthor) {
      return res.status(400).json({ message: 'Ya existe un autor con ese email.' });
    }

    const createdAuthor = await insert(author);

    // En clase la creación también responde 200 (el 201 no se usa).
    res.status(200).json(createdAuthor);
  } catch (error) {
    console.error('[authors.controller.createAuthor]', error);
    res.status(500).json({ message: 'No se pudo crear el autor.' });
  }
};
