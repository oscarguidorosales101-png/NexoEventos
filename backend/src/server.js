import app from './app.js';
import pool from './config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verificar conexión activa a MySQL antes de abrir el puerto
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() AS current_db, VERSION() AS version');
    connection.release();

    console.log('====================================================');
    console.log('🚀 NEXOEVENTOS - SERVIDOR BACKEND INICIADO');
    console.log('====================================================');
    console.log(`🔌 Conexión MySQL establecida:`);
    console.log(`   - Base de datos: ${rows[0].current_db}`);
    console.log(`   - Versión MySQL: ${rows[0].version}`);
    console.log(`🌐 Servidor escuchando en: http://localhost:${PORT}`);
    console.log(`📡 Endpoints base: http://localhost:${PORT}/api`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log('====================================================');

    const server = app.listen(PORT);
    return server;
  } catch (error) {
    console.error('❌ Error crítico al conectar con la base de datos MySQL:', error.message);
    console.error('Verifique que el servicio MySQL80 esté en ejecución y los datos de .env sean correctos.');
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { startServer };

