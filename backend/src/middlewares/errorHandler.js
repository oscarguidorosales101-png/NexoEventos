import { sendError } from '../utils/response.js';

/**
 * Middleware para rutas no encontradas (404)
 */
export const notFoundHandler = (req, res, next) => {
  return sendError(
    res,
    404,
    `No se encontró el recurso solicitado: [${req.method}] ${req.originalUrl}`,
    'NOT_FOUND'
  );
};

/**
 * Middleware global para captura de excepciones no controladas
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);

  // Error de sintaxis JSON en el cuerpo de la petición
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Los datos enviados no son válidos (formato JSON incorrecto).', 'BAD_REQUEST');
  }

  // Errores de MySQL
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return sendError(
      res,
      409,
      'No se puede completar la operación porque existe una dependencia o conflicto.',
      'CONFLICT',
      { reason: 'Existen registros vinculados que impiden la eliminación' }
    );
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(
      res,
      409,
      'No se puede completar la operación porque existe una dependencia o conflicto.',
      'CONFLICT',
      { reason: 'Entrada duplicada para campo único' }
    );
  }

  const statusCode = err.statusCode || 500;
  return sendError(
    res,
    statusCode,
    statusCode === 500 ? 'Ocurrió un error interno. Inténtalo nuevamente.' : (err.message || 'Error en la solicitud'),
    err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR')
  );
};
