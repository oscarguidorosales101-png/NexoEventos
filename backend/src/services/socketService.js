import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

let ioInstance = null;
const onlineUsers = new Map(); // id_usuario -> { id_usuario, nombre, rol, socketId, connectedAt }

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Middleware de autenticación JWT para Socket.IO
  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Autenticación requerida para conexión en tiempo real'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return next(new Error('Token de conexión inválido o expirado'));
      }

      const [rows] = await pool.query(
        `SELECT u.id_usuario, u.nombre, u.correo, u.id_rol, u.id_cliente, r.nombre AS rol
         FROM usuarios u
         INNER JOIN roles r ON u.id_rol = r.id_rol
         WHERE u.id_usuario = ?`,
        [decoded.id_usuario]
      );

      if (rows.length === 0) {
        return next(new Error('Usuario no encontrado'));
      }

      socket.user = rows[0];
      next();
    } catch (err) {
      next(new Error('Error interno de autenticación de socket'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    const userRole = user.rol.toLowerCase();

    // Registrar presencia en vivo
    onlineUsers.set(user.id_usuario, {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      rol: user.rol,
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    });

    // Asignar salas según rol y restricciones de privacidad
    if (userRole === 'administrador') {
      socket.join('admin');
      socket.join('staff');
    } else if (userRole === 'supervisor') {
      socket.join('supervisor');
      socket.join('staff');
    } else if (userRole === 'cliente' && user.id_cliente) {
      socket.join(`client_${user.id_cliente}`);
    }

    // Emitir lista de presencia al staff autorizado
    emitPresenceUpdate();

    socket.on('disconnect', () => {
      onlineUsers.delete(user.id_usuario);
      emitPresenceUpdate();
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

const emitPresenceUpdate = () => {
  if (!ioInstance) return;
  const staffPresence = Array.from(onlineUsers.values()).map(u => ({
    id_usuario: u.id_usuario,
    nombre: u.nombre,
    rol: u.rol
  }));
  ioInstance.to('staff').emit('presence:update', staffPresence);
};

/**
 * Emisiones segmentadas por rol y pertenencia
 */
export const broadcastScheduleEvent = (eventType, schedule) => {
  if (!ioInstance) return;

  // El staff (admin y supervisor) siempre recibe la actualización
  ioInstance.to('staff').emit(eventType, schedule);

  // Si la agenda está ligada a un evento de un cliente y es pública (categoría Event),
  // emitir también a la sala privada de ese cliente
  if (schedule.id_cliente && schedule.nombre_categoria === 'Event') {
    ioInstance.to(`client_${schedule.id_cliente}`).emit(eventType, schedule);
  }
};

export const broadcastScheduleDeleted = (id_agenda, id_cliente = null) => {
  if (!ioInstance) return;
  ioInstance.to('staff').emit('schedule:deleted', { id_agenda });
  if (id_cliente) {
    ioInstance.to(`client_${id_cliente}`).emit('schedule:deleted', { id_agenda });
  }
};

export const broadcastNoteEvent = (eventType, note, schedule) => {
  if (!ioInstance) return;
  // Las notas operativas son de acceso exclusivo para el personal (staff)
  ioInstance.to('staff').emit(eventType, { id_agenda: schedule.id_agenda, note });
};

export const broadcastTeamEvent = (eventType, team, schedule) => {
  if (!ioInstance) return;
  ioInstance.to('staff').emit(eventType, { id_agenda: schedule.id_agenda, team });
};

