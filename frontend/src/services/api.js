/**
 * Cliente HTTP Centralizado para NexoEventos
 * Administra cabeceras Authorization, intercepta respuestas 401 y parsea JSON.
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Si el servidor responde 401 (token expirado o inválido)
    if (response.status === 401) {
      localStorage.removeItem('nexoeventos_token');
      localStorage.removeItem('nexoeventos_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || `Error en la petición HTTP: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' })
};

export default api;

