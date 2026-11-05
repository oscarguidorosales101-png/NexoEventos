/**
 * Envoltorios de respuesta JSON estandarizados para la API NexoEventos
 */

export const sendSuccess = (res, statusCode = 200, message = 'Operación exitosa', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, message = 'Error interno del servidor', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors !== null && errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

