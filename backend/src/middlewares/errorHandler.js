import { sendError } from '../utils/response.js';

/**
 * Middleware para rutas no encontradas (404)
 */
export const notFoundHandler = (req, res, next) => {
  return sendError(
    res,
    404,
    `Ruta no encontrada: [${req.method}] ${req.originalUrl}`
  );
};

/**
 * Middleware global para captura de excepciones no controladas
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);

  // Error de sintaxis JSON en el cuerpo de la petición
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'El formato del JSON enviado en el cuerpo de la petición es inválido');
  }

  // Errores de MySQL
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return sendError(
      res,
      409,
      'Conflicto de integridad: No se puede eliminar o modificar el registro porque existen registros dependientes vinculados'
    );
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(
      res,
      409,
      'Conflicto de duplicidad: Ya existe un registro con los mismos valores únicos'
    );
  }

  return sendError(
    res,
    err.statusCode || 500,
    err.message || 'Error interno del servidor'
  );
};

