import DB from '../config/db.js';

// Un modelo es una librería con funciones para atacar la base de datos.
// El SQL vive sólo en los ficheros *.model.js.

const POST_SELECT = `
  SELECT
    p.id,
    p.titulo,
    p.descripcion,
    p.fecha_creacion,
    p.categoria,
    a.id     AS autorId,
    a.nombre AS autorNombre,
    a.email  AS autorEmail,
    a.imagen AS autorImagen
  FROM posts AS p
  INNER JOIN autores AS a ON a.id = p.autor_id
`;

/**
 * Da forma a la fila que devuelve el JOIN: el autor va anidado en el post.
 * @param {Object} row fila plana del JOIN
 * @returns {Object} post con su autor
 */
const toPost = (row) => ({
  id: row.id,
  titulo: row.titulo,
  descripcion: row.descripcion,
  fecha_creacion: row.fecha_creacion,
  categoria: row.categoria,
  autor: {
    id: row.autorId,
    nombre: row.autorNombre,
    email: row.autorEmail,
    imagen: row.autorImagen,
  },
});

/**
 * Devuelve todos los posts con su autor.
 * @returns {Promise<Array<Object>>} filas listas para responder
 */
export const selectAll = async () => {
  const sql = `${POST_SELECT} ORDER BY p.fecha_creacion DESC, p.id DESC`;
  const [rows] = await DB.execute(sql);
  return rows.map(toPost);
};

/**
 * Devuelve un post por su id.
 * @param {number} id id del post
 * @returns {Promise<Object|null>} el post o null si no existe
 */
export const selectById = async (id) => {
  const sql = `${POST_SELECT} WHERE p.id = ?`;
  const [rows] = await DB.execute(sql, [id]);
  if (rows.length === 0) {
    return null;
  }
  return toPost(rows[0]);
};

/**
 * Devuelve los posts de un autor.
 * @param {number} authorId id del autor
 * @returns {Promise<Array<Object>>} filas listas para responder
 */
export const selectByAuthorId = async (authorId) => {
  const sql = `${POST_SELECT} WHERE p.autor_id = ? ORDER BY p.fecha_creacion DESC, p.id DESC`;
  const [rows] = await DB.execute(sql, [authorId]);
  return rows.map(toPost);
};

/**
 * Inserta un post y devuelve la fila creada.
 * @param {{titulo: string, descripcion: string, categoria: string, autorId: number}} post datos del post
 * @returns {Promise<Object>} el post insertado
 */
export const insert = async ({ titulo, descripcion, categoria, autorId }) => {
  const sql = `
    INSERT INTO posts (titulo, descripcion, categoria, autor_id)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await DB.execute(sql, [titulo, descripcion, categoria, autorId]);
  return selectById(result.insertId);
};
