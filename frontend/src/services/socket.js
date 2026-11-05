import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('nexoeventos_token');
  
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Conexión Socket.IO establecida con NexoEventos [ID:', socket.id, ']');
    });

    socket.on('connect_error', (err) => {
      console.warn('[SOCKET] Error de conexión Socket.IO:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Conexión Socket.IO cerrada:', reason);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToScheduleEvents = (callbacks = {}) => {
  const s = getSocket();
  if (!s) return () => {};

  const handlers = {
    'agenda:creada': (data) => callbacks.onCreated?.(data),
    'agenda:actualizada': (data) => callbacks.onUpdated?.(data),
    'agenda:reagendada': (data) => callbacks.onRescheduled?.(data),
    'agenda:eliminada': (data) => callbacks.onDeleted?.(data),
    'agenda:nota_creada': (data) => callbacks.onNoteCreated?.(data),
    'agenda:nota_actualizada': (data) => callbacks.onNoteUpdated?.(data),
    'agenda:nota_eliminada': (data) => callbacks.onNoteDeleted?.(data),
    'agenda:integrante_agregado': (data) => callbacks.onMemberAdded?.(data),
    'agenda:integrante_removido': (data) => callbacks.onMemberRemoved?.(data),
    'cliente:alerta_evento': (data) => callbacks.onClientAlert?.(data)
  };

  Object.entries(handlers).forEach(([event, handler]) => {
    s.on(event, handler);
  });

  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      s.off(event, handler);
    });
  };
};

