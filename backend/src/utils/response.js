/**
 * Envoltorios de respuesta JSON estandarizados para la API NexoEventos
 * Cumpliendo con el estándar unificado de errores HTTP de la Fase 3
 */

const DEFAULT_ERROR_MESSAGES = {
  400: 'Los datos enviados no son válidos.',
  401: 'No has iniciado sesión o tu sesión ha expirado.',
  403: 'No tienes permisos para realizar esta operación.',
  404: 'No se encontró el recurso solicitado.',
  409: 'No se puede completar la operación porque existe una dependencia o conflicto.',
  422: 'Información válida en formato, pero incompatible con las reglas de negocio.',
  429: 'Demasiadas solicitudes. Por favor intente más tarde.',
  500: 'Ocurrió un error interno. Inténtalo nuevamente.'
};

const DEFAULT_ERROR_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR'
};

export const sendSuccess = (res, statusCode = 200, message = 'Operación exitosa', data = null) => {
  if (statusCode === 204) {
    return res.status(204).send();
  }

  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, message = null, code = null, details = null) => {
  const finalMessage = message || DEFAULT_ERROR_MESSAGES[statusCode] || 'Error en la solicitud';
  const finalCode = code || DEFAULT_ERROR_CODES[statusCode] || 'ERROR';

  const errorObj = {
    code: finalCode,
    message: finalMessage
  };

  if (details !== null && details !== undefined) {
    errorObj.details = details;
  }

  const response = {
    success: false,
    message: finalMessage, // Soporte retrocompatible
    error: errorObj
  };

  return res.status(statusCode).json(response);
};
