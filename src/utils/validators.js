// Validadores de los cuerpos de las peticiones.
//
// `POST` y `PUT` validan el mismo cuerpo con las mismas reglas y los mismos
// mensajes; `PATCH` valida esas mismas reglas con todos los campos opcionales.
// En vez de repetir las guard clauses en cada controlador, viven acá: un
// validador por recurso, sin dependencias, y el controlador decide qué hacer con
// el resultado.
//
// Un validador devuelve `{ values, error }`:
// - `error`: el mensaje para responder 400, o `null` si no hay nada que rechazar.
// - `values`: los campos ya normalizados. Con `partial: false` vienen todos los
//   del recurso; con `partial: true` vienen sólo los enviados, así que un objeto
//   vacío significa "no mandó ningún campo".
//
// La unicidad del email NO está acá: necesita consultar el modelo, así que el
// controlador la comprueba después de validar.

// Expresión regular para validar emails: exige un @ y un punto en el dominio,
// sin espacios ni caracteres raros.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Indica si el cliente envió la clave, aunque el valor sea `null` o `undefined`.
 * @param {Object} body cuerpo de la petición
 * @param {string} key nombre del campo
 * @returns {boolean} true si la clave está en el body
 */
const wasSent = (body, key) => Object.prototype.hasOwnProperty.call(body, key);

/**
 * Normaliza y valida el nombre de un autor.
 * @param {unknown} value valor recibido
 * @returns {{value?: string, error?: string}} valor listo para la base o mensaje
 */
const nombreRule = (value) => {
  if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 100) {
    return { error: 'El nombre debe tener entre 3 y 100 caracteres.' };
  }
  return { value: value.trim() };
};

/**
 * Normaliza y valida el email de un autor.
 * @param {unknown} value valor recibido
 * @returns {{value?: string, error?: string}} email en minúsculas o mensaje
 */
const emailRule = (value) => {
  if (typeof value !== 'string' || !EMAIL_REGEX.test(value.trim()) || value.trim().length > 150) {
    return { error: 'El email no es válido (máximo 150 caracteres).' };
  }
  return { value: value.trim().toLowerCase() };
};

/**
 * Normaliza y valida la imagen de un autor. Ausente, `null` o vacía es `null`.
 * @param {unknown} value valor recibido
 * @returns {{value?: string|null, error?: string}} la URL o mensaje
 */
const imagenRule = (value) => {
  const normalizedImage = value === undefined || value === null || String(value).trim() === ''
    ? null
    : String(value).trim();

  if (normalizedImage !== null && normalizedImage.length > 500) {
    return { error: 'La URL de la imagen no puede superar 500 caracteres.' };
  }
  return { value: normalizedImage };
};

/**
 * Normaliza y valida el título de un post.
 * @param {unknown} value valor recibido
 * @returns {{value?: string, error?: string}} título recortado o mensaje
 */
const tituloRule = (value) => {
  if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 150) {
    return { error: 'El título debe tener entre 3 y 150 caracteres.' };
  }
  return { value: value.trim() };
};

/**
 * Normaliza y valida la descripción de un post.
 * @param {unknown} value valor recibido
 * @returns {{value?: string, error?: string}} descripción recortada o mensaje
 */
const descripcionRule = (value) => {
  if (typeof value !== 'string' || value.trim().length < 10) {
    return { error: 'La descripción debe tener al menos 10 caracteres.' };
  }
  return { value: value.trim() };
};

/**
 * Normaliza y valida la categoría de un post.
 * @param {unknown} value valor recibido
 * @returns {{value?: string, error?: string}} categoría recortada o mensaje
 */
const categoriaRule = (value) => {
  if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 60) {
    return { error: 'La categoría debe tener entre 3 y 60 caracteres.' };
  }
  return { value: value.trim() };
};

/**
 * Normaliza y valida el autorId de un post: entero positivo.
 * @param {unknown} value valor recibido
 * @returns {{value?: number, error?: string}} el id numérico o mensaje
 */
const autorIdRule = (value) => {
  const numericAuthorId = Number(value);

  if (!Number.isInteger(numericAuthorId) || numericAuthorId <= 0) {
    return { error: 'El autorId debe ser un número entero positivo.' };
  }
  return { value: numericAuthorId };
};

// El orden importa: es el orden en que se validan y se responden los errores.
const AUTHOR_FIELDS = [
  ['nombre', nombreRule],
  ['email', emailRule],
  ['imagen', imagenRule],
];

const POST_FIELDS = [
  ['titulo', tituloRule],
  ['descripcion', descripcionRule],
  ['categoria', categoriaRule],
  ['autorId', autorIdRule],
];

/**
 * Aplica las reglas de un recurso al cuerpo recibido.
 * @param {Object} body cuerpo de la petición
 * @param {Array<[string, Function]>} fields campos en orden, con su regla
 * @param {boolean} partial true = sólo los campos enviados, sin obligatorios
 * @returns {{values: Object|null, error: string|null}} valores normalizados o mensaje
 */
const validate = (body, fields, partial) => {
  const data = body ?? {};
  const values = {};

  for (const [key, rule] of fields) {
    // En modo parcial un campo ausente se deja como está: no se valida ni se escribe.
    if (partial && !wasSent(data, key)) {
      continue;
    }

    const { value, error } = rule(data[key]);

    if (error !== undefined) {
      return { values: null, error };
    }

    values[key] = value;
  }

  return { values, error: null };
};

/**
 * Valida el cuerpo de un autor. `POST` y `PUT` usan `partial: false` (los tres
 * campos obligatorios); `PATCH` usa `partial: true` (ninguno obligatorio).
 * @param {Object} body cuerpo de la petición
 * @param {{partial?: boolean}} [options] modo de validación
 * @returns {{values: Object|null, error: string|null}} autor normalizado o mensaje
 */
export const validateAuthorBody = (body, { partial = false } = {}) =>
  validate(body, AUTHOR_FIELDS, partial);

/**
 * Valida el cuerpo de un post. `POST` y `PUT` usan `partial: false` (los cuatro
 * campos obligatorios); `PATCH` usa `partial: true` (ninguno obligatorio).
 * @param {Object} body cuerpo de la petición
 * @param {{partial?: boolean}} [options] modo de validación
 * @returns {{values: Object|null, error: string|null}} post normalizado o mensaje
 */
export const validatePostBody = (body, { partial = false } = {}) =>
  validate(body, POST_FIELDS, partial);
