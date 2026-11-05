import { sendError } from '../utils/response.js';

/**
 * Middleware para autorización basada en roles (RBAC)
 * Permite acceso únicamente a los roles especificados en los argumentos
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return sendError(res, 401, 'Usuario no autenticado para validar permisos');
    }

    const userRole = req.user.rol.toLowerCase();
    const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      return sendError(
        res,
        403,
        `Acceso denegado: El rol '${req.user.rol}' no tiene permisos suficientes para realizar esta acción. Requerido: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

export const requireAdmin = authorizeRoles('administrador');
export const requireStaff = authorizeRoles('administrador', 'supervisor');

