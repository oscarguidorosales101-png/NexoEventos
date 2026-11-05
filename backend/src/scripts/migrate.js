import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'nexoeventos'
} = process.env;

const migrationsDir = path.resolve(__dirname, '../../migrations');

async function runMigrations() {
  const isStatusCheck = process.argv.includes('--status');
  console.log('====================================================');
  console.log(`[MIGRACIONES] NexoEventos DB Engine`);
  console.log(`[CONEXIÓN] Host: ${DB_HOST}:${DB_PORT} | Usuario: ${DB_USER} | BD: ${DB_NAME}`);
  console.log('====================================================');

  let connection;
  try {
    // 1. Conectar al servidor MySQL (sin especificar BD para crearla si no existe)
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });

    // 2. Crear la base de datos si no existe
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;
    `);

    // 3. Seleccionar la base de datos
    await connection.changeUser({ database: DB_NAME });

    // 4. Crear tabla de control schema_migrations si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`migration_name\` VARCHAR(255) NOT NULL UNIQUE,
        \`executed_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Consultar migraciones ejecutadas previamente
    const [rows] = await connection.query(`SELECT migration_name, executed_at FROM schema_migrations ORDER BY id ASC`);
    const executedMigrations = new Map(rows.map(r => [r.migration_name, r.executed_at]));

    // 6. Leer archivos de migración
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('ℹ No se encontraron archivos de migración en:', migrationsDir);
      return;
    }

    if (isStatusCheck) {
      console.log('\n--- ESTADO DE LAS MIGRACIONES ---');
      files.forEach((file) => {
        const isExecuted = executedMigrations.has(file);
        const statusText = isExecuted 
          ? `[APLICADA] (${executedMigrations.get(file).toISOString()})` 
          : '[PENDIENTE]';
        console.log(`- ${file.padEnd(35)} : ${statusText}`);
      });
      console.log('---------------------------------\n');
      return;
    }

    // 7. Ejecutar migraciones pendientes
    let appliedCount = 0;
    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`[OMITIDA] ${file} (Ya fue ejecutada previamente)`);
        continue;
      }

      console.log(`[EJECUTANDO] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      if (!sql.trim()) {
        console.log(`[AVISO] ${file} está vacío.`);
        continue;
      }

      // Ejecutar en bloque o transaccional
      try {
        await connection.query(sql);
        await connection.query(`INSERT INTO schema_migrations (migration_name) VALUES (?)`, [file]);
        console.log(`[OK] ${file} ejecutada y registrada.`);
        appliedCount++;
      } catch (migrationErr) {
        console.error(`\n[ERROR CRITICO EN MIGRACION] Falló el archivo: ${file}`);
        console.error(`Detalle del error: ${migrationErr.message}`);
        console.error('El proceso de migraciones se ha detenido para proteger la integridad de los datos.\n');
        process.exit(1);
      }
    }

    console.log('====================================================');
    if (appliedCount > 0) {
      console.log(`[OK] Se aplicaron satisfactoriamente ${appliedCount} migraciones.`);
    } else {
      console.log('[OK] La base de datos ya está al día. No había migraciones pendientes.');
    }
    console.log('====================================================');
  } catch (err) {
    console.error('[ERROR] Error de conexión o inicialización en MySQL:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();

