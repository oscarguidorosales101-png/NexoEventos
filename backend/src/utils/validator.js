/**
 * Funciones de validación para entradas de la API NexoEventos
 */

export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.trim().length >= 8;
};

export const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

export const isNonNegativeNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const CLIENT_TYPES = ['persona', 'empresa'];
export const SERVICE_STATUSES = ['activo', 'inactivo'];
export const EVENT_STATUSES = ['pendiente', 'confirmado', 'completado', 'cancelado'];

