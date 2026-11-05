import http from 'http';
import app from './app.js';
import pool from './config/db.js';
import { initSocket } from './services/socketService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Verificar conexión activa a MySQL antes de abrir el puerto
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() AS current_db, VERSION() AS version');
    connection.release();

    // 2. Crear servidor HTTP con soporte para Express y Socket.IO
    const server = http.createServer(app);

    // 3. Inicializar Socket.IO para eventos en tiempo real
    const io = initSocket(server);

    console.log('====================================================');
    console.log('[NEXOEVENTOS] SERVIDOR BACKEND (REST + SOCKET.IO)');
    console.log('====================================================');
    console.log(`[DB] Conexión MySQL establecida:`);
    console.log(`   - Base de datos: ${rows[0].current_db}`);
    console.log(`   - Versión MySQL: ${rows[0].version}`);
    console.log(`[CONFIG] Zona Horaria: America/Costa_Rica (UTC-6)`);
    console.log(`[HTTP] Servidor escuchando en: http://localhost:${PORT}`);
    console.log(`[API] Endpoints base: http://localhost:${PORT}/api`);
    console.log(`[WS] Socket.IO habilitado para sincronización en tiempo real`);
    console.log('====================================================');

    server.listen(PORT);
    return server;
  } catch (error) {
    console.error('[ERROR] Error crítico al iniciar el servidor backend:', error.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { startServer };
