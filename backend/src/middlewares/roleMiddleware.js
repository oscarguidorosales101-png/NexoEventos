import { sendError } from '../utils/response.js';

/**
 * Middleware para autorización basada en roles (RBAC)
 * Permite acceso únicamente a los roles especificados en los argumentos.
 * Si el usuario no tiene los permisos requeridos, responde con HTTP 403 FORBIDDEN.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return sendError(res, 401, 'No has iniciado sesión o tu sesión ha expirado.', 'UNAUTHORIZED');
    }

    const userRole = req.user.rol.toLowerCase();
    const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      return sendError(
        res,
        403,
        'No tienes permisos para realizar esta operación.',
        'FORBIDDEN'
      );
    }

    next();
  };
};

export const requireAdmin = authorizeRoles('administrador');
export const requireStaff = authorizeRoles('administrador', 'supervisor');
