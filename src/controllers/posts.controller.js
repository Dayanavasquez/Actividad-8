import { selectById as selectAuthorById } from '../models/authors.model.js';
import { selectAll, insert, update, remove } from '../models/posts.model.js';
import { validatePostBody } from '../utils/validators.js';

const NO_FIELDS_MESSAGE = 'No enviaste ningún campo para actualizar.';

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
    // se valida antes de ir a la base de datos.
    const { values: post, error } = validatePostBody(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const author = await selectAuthorById(post.autorId);

    // no se crea un post de un autor que no existe.
    if (!author) {
      return res.status(400).json({ message: `No existe un autor con el id ${post.autorId}.` });
    }

    const createdPost = await insert(post);

    // En clase la creación también responde 200 (el 201 no se usa).
    res.status(200).json(createdPost);
  } catch (error) {
    console.error('[posts.controller.createPost]', error);
    res.status(500).json({ message: 'No se pudo crear el post.' });
  }
};

/**
 * Actualiza un post. El post ya viene buscado por `checkId`.
 * Se valida con las mismas reglas y mensajes que la creación: el `PUT` reemplaza
 * los cuatro campos editables (la `fecha_creacion` no se toca).
 * PUT /api/posts/:id
 * @param {import('express').Request} req petición HTTP con `req.post` y el post en el body
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const updatePost = async (req, res) => {
  try {
    // mismas reglas y mismos mensajes que en createPost, todas en
    // el validador compartido.
    const { values: post, error } = validatePostBody(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const author = await selectAuthorById(post.autorId);

    // no se puede mover un post a un autor que no existe.
    if (!author) {
      return res.status(400).json({ message: `No existe un autor con el id ${post.autorId}.` });
    }

    const updatedPost = await update(req.post.id, post);

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('[posts.controller.updatePost]', error);
    res.status(500).json({ message: 'No se pudo actualizar el post.' });
  }
};

/**
 * Actualiza **parcialmente** un post: sólo los campos que vienen en el body. El
 * post ya viene buscado por `checkId`. Valida con las mismas reglas que el `PUT`
 * pero sin campos obligatorios, y los ausentes conservan su valor guardado
 * (`fecha_creacion` no se toca nunca). Un body sin ningún campo conocido es un
 * error del cliente, no un éxito silencioso.
 * PATCH /api/posts/:id
 * @param {import('express').Request} req petición HTTP con `req.post` y el parche en el body
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const patchPost = async (req, res) => {
  try {
    const { values, error } = validatePostBody(req.body, { partial: true });

    if (error) {
      return res.status(400).json({ message: error });
    }

    // PATCH sin campos no hace nada, y eso es un error del cliente.
    if (Object.keys(values).length === 0) {
      return res.status(400).json({ message: NO_FIELDS_MESSAGE });
    }

    // Sólo se comprueba el autor si el parche lo manda.
    if (values.autorId !== undefined) {
      const author = await selectAuthorById(values.autorId);

      // no se puede mover un post a un autor que no existe.
      if (!author) {
        return res.status(400).json({ message: `No existe un autor con el id ${values.autorId}.` });
      }
    }

    // `update` sigue recibiendo la fila completa: lo que falta sale de `req.post`,
    // y el `autorId` guardado vive en el `autor` anidado.
    const mergedPost = {
      titulo: values.titulo ?? req.post.titulo,
      descripcion: values.descripcion ?? req.post.descripcion,
      categoria: values.categoria ?? req.post.categoria,
      autorId: values.autorId ?? req.post.autor.id,
    };
    const updatedPost = await update(req.post.id, mergedPost);

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('[posts.controller.patchPost]', error);
    res.status(500).json({ message: 'No se pudo actualizar el post.' });
  }
};

/**
 * Borra un post. El post ya viene buscado por `checkId`, así que se responde con
 * esa misma fila (200, no 204), que además ya trae su `autor` anidado.
 * DELETE /api/posts/:id
 * @param {import('express').Request} req petición HTTP con `req.post`
 * @param {import('express').Response} res respuesta HTTP
 * @returns {Promise<void>}
 */
export const removePost = async (req, res) => {
  try {
    await remove(req.post.id);
    res.status(200).json(req.post);
  } catch (error) {
    console.error('[posts.controller.removePost]', error);
    res.status(500).json({ message: 'No se pudo borrar el post.' });
  }
};
