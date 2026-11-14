import { selectAll, selectByEmail, insert, update, remove } from '../models/authors.model.js';
import { selectByAuthorId } from '../models/posts.model.js';
import { validateAuthorBody } from '../utils/validators.js';

const NO_FIELDS_MESSAGE = 'No enviaste ningún campo para actualizar.';

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
    // primero se valida, después se toca la base de datos.
    const { values: author, error } = validateAuthorBody(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

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

/**
 * Actualiza un autor. El autor ya viene buscado por `checkId`.
 * Se valida con las mismas reglas y mensajes que la creación: el `PUT` reemplaza
 * los tres campos editables, no hace un parche parcial. Un email repetido sólo es
 * conflicto cuando pertenece a OTRO autor; repetir el propio tiene que funcionar.
 * PUT /api/authors/:id
 * @param {import('express').Request} req petición HTTP con `req.author` y el autor en el body
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const updateAuthor = async (req, res) => {
  try {
    // mismas reglas y mismos mensajes que en createAuthor, todas
    // en el validador compartido.
    const { values: author, error } = validateAuthorBody(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const existingAuthor = await selectByEmail(author.email);

    // el email es de otro autor, no del que estamos editando.
    if (existingAuthor && existingAuthor.id !== req.author.id) {
      return res.status(400).json({ message: 'Ya existe un autor con ese email.' });
    }

    const updatedAuthor = await update(req.author.id, author);

    res.status(200).json(updatedAuthor);
  } catch (error) {
    console.error('[authors.controller.updateAuthor]', error);
    res.status(500).json({ message: 'No se pudo actualizar el autor.' });
  }
};

/**
 * Actualiza **parcialmente** un autor: sólo los campos que vienen en el body. El
 * autor ya viene buscado por `checkId`. Valida con las mismas reglas que el `PUT`
 * pero sin campos obligatorios, y los ausentes conservan su valor guardado. Un
 * body sin ningún campo conocido es un error del cliente, no un éxito silencioso.
 * PATCH /api/authors/:id
 * @param {import('express').Request} req petición HTTP con `req.author` y el parche en el body
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const patchAuthor = async (req, res) => {
  try {
    const { values, error } = validateAuthorBody(req.body, { partial: true });

    if (error) {
      return res.status(400).json({ message: error });
    }

    // PATCH sin campos no hace nada, y eso es un error del cliente.
    if (Object.keys(values).length === 0) {
      return res.status(400).json({ message: NO_FIELDS_MESSAGE });
    }

    // La unicidad del email necesita el modelo: sólo se comprueba si el email vino, no pueden existir autores con el mismo mail.
    if (values.email !== undefined) {
      const existingAuthor = await selectByEmail(values.email);

      // el email es de otro autor, no del que estamos editando.
      if (existingAuthor && existingAuthor.id !== req.author.id) {
        return res.status(400).json({ message: 'Ya existe un autor con ese email.' });
      }
    }

    // `update` sigue recibiendo la fila completa: lo que falta sale de `req.author`.
    const mergedAuthor = { ...req.author, ...values };
    const updatedAuthor = await update(req.author.id, mergedAuthor);

    res.status(200).json(updatedAuthor);
  } catch (error) {
    console.error('[authors.controller.patchAuthor]', error);
    res.status(500).json({ message: 'No se pudo actualizar el autor.' });
  }
};

/**
 * Borra un autor. El autor ya viene buscado por `checkId`, así que se responde con
 * esa misma fila (200, no 204). Ojo: `fk_posts_autor` es `ON DELETE CASCADE`, así
 * que sus posts se van con él.
 * DELETE /api/authors/:id
 * @param {import('express').Request} req petición HTTP con `req.author`
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const removeAuthor = async (req, res) => {
  try {
    await remove(req.author.id);
    res.status(200).json(req.author);
  } catch (error) {
    console.error('[authors.controller.removeAuthor]', error);
    res.status(500).json({ message: 'No se pudo borrar el autor.' });
  }
};
