import DB from '../config/db.js';

// Un modelo es una librería con funciones para atacar la base de datos.
// El SQL vive sólo en los ficheros *.model.js.

const AUTHOR_COLUMNS = 'id, nombre, email, imagen';

/**
 * Devuelve todos los autores.
 * @returns {Promise<Array<Object>>} filas de la tabla autores
 */
export const selectAll = async () => {
  const sql = `SELECT ${AUTHOR_COLUMNS} FROM autores ORDER BY id ASC`;
  const [rows] = await DB.execute(sql);
  return rows;
};

/**
 * Devuelve un autor por su id.
 * @param {number} id id del autor
 * @returns {Promise<Object|null>} el autor o null si no existe
 */
export const selectById = async (id) => {
  const sql = `SELECT ${AUTHOR_COLUMNS} FROM autores WHERE id = ?`;
  const [rows] = await DB.execute(sql, [id]);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

/**
 * Busca un autor por su nombre (para detectar duplicados).
 * @param {string} name nombre del autor
 * @returns {Promise<Object|null>} el autor o null si no existe
 */
export const selectByName = async (name) => {
  const sql = `SELECT ${AUTHOR_COLUMNS} FROM autores WHERE nombre = ?`;
  const [rows] = await DB.execute(sql, [name]);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

/**
 * Busca un autor por su email (para detectar duplicados).
 * @param {string} email email del autor
 * @returns {Promise<Object|null>} el autor o null si no existe
 */
export const selectByEmail = async (email) => {
  const sql = `SELECT ${AUTHOR_COLUMNS} FROM autores WHERE email = ?`;
  const [rows] = await DB.execute(sql, [email]);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

/**
 * Inserta un autor y devuelve la fila creada.
 * @param {{nombre: string, email: string, imagen: string|null}} autor datos del autor
 * @returns {Promise<Object>} el autor insertado
 */
export const insert = async ({ nombre, email, imagen }) => {
  const sql = 'INSERT INTO autores (nombre, email, imagen) VALUES (?, ?, ?)';
  const [result] = await DB.execute(sql, [nombre, email, imagen]);
  return selectById(result.insertId);
};

/**
 * Reemplaza los datos de un autor y devuelve la fila actualizada.
 * @param {number} id id del autor
 * @param {{nombre: string, email: string, imagen: string|null}} autor datos del autor
 * @returns {Promise<Object|null>} el autor actualizado o null si no existe
 */
export const update = async (id, { nombre, email, imagen }) => {
  const sql = 'UPDATE autores SET nombre = ?, email = ?, imagen = ? WHERE id = ?';
  await DB.execute(sql, [nombre, email, imagen, id]);
  return selectById(id);
};

/**
 * Borra un autor. Si tenía posts, la clave externa `fk_posts_autor` los borra en
 * cascada, así que esta llamada también se lleva sus publicaciones.
 * @param {number} id id del autor
 * @returns {Promise<boolean>} true si se borró la fila
 */
export const remove = async (id) => {
  const sql = 'DELETE FROM autores WHERE id = ?';
  const [result] = await DB.execute(sql, [id]);
  return result.affectedRows > 0;
};
