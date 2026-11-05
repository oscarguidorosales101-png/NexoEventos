import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendError } from '../utils/response.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return sendError(res, 401, 'Acceso no autorizado: Token no proporcionado');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return sendError(res, 401, 'Formato de token inválido. Se espera: Bearer <token>');
    }

    const token = parts[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Sesión expirada. Por favor inicie sesión nuevamente.', { code: 'TOKEN_EXPIRED' });
      }
      return sendError(res, 401, 'Token inválido o manipulado', { code: 'INVALID_TOKEN' });
    }

    // Comprobar existencia real del usuario en la base de datos y obtener rol actualizado
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.id_rol, u.id_cliente, u.nombre, u.correo, u.fecha_creacion,
              r.nombre AS rol,
              c.nombre AS nombre_cliente, c.tipo_cliente
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN clientes c ON u.id_cliente = c.id_cliente
       WHERE u.id_usuario = ?`,
      [decoded.id_usuario]
    );

    if (rows.length === 0) {
      return sendError(res, 401, 'El usuario asociado a este token no existe en el sistema');
    }

    const user = rows[0];
    req.user = {
      id_usuario: user.id_usuario,
      id_rol: user.id_rol,
      id_cliente: user.id_cliente,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      nombre_cliente: user.nombre_cliente,
      tipo_cliente: user.tipo_cliente
    };

    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return sendError(res, 500, 'Error interno durante la verificación de credenciales');
  }
};

