/**
 * Cliente HTTP Centralizado para NexoEventos
 * Administra cabeceras Authorization, intercepta respuestas 401, 403 y 409,
 * extrayendo los mensajes del estándar de error unificado.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('nexoeventos_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (networkErr) {
    const error = new Error('No se pudo establecer conexión con el servidor.');
    error.status = 0;
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  // Si el servidor responde 401: Sesión expirada o no autenticado
  if (response.status === 401) {
    localStorage.removeItem('nexoeventos_token');
    localStorage.removeItem('nexoeventos_user');
    window.dispatchEvent(new CustomEvent('auth:unauthorized', {
      detail: { message: 'No has iniciado sesión o tu sesión ha expirado.' }
    }));
  }

  // Si el servidor responde 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      data = { message: 'Respuesta del servidor no válida' };
    }
  } else {
    data = { rawText: await response.text() };
  }

  if (!response.ok) {
    // Extraer mensaje del estándar unificado
    const errorMessage = data?.error?.message || data?.message || 'Error en la operación';
    const errorCode = data?.error?.code || `HTTP_${response.status}`;
    const errorDetails = data?.error?.details || data?.errors || null;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.code = errorCode;
    error.details = errorDetails;
    error.data = data;

    // Si es 403, notificar sin cerrar sesión
    if (response.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', {
        detail: { message: errorMessage }
      }));
    }

    throw error;
  }

  return data;
};

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' })
};

export default api;
