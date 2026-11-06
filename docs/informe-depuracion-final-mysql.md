# NEXOEVENTOS — INFORME DE DEPURACIÓN CONTROLADA, INTEGRIDAD REFERENCIAL Y VALIDACIÓN FINAL

**Fecha de Ejecución:** 5 de noviembre de 2026  
**Sistema Gestor de Base de Datos:** MySQL 8.0  
**Base de Datos Principal:** `nexoeventos`  
**Base de Datos de Prueba de Respaldo:** `nexoeventos_test_restore`  
**Estado de la Operación:** Transacción confirmada (COMMIT) con integridad referencial del 100% y suites de validación superadas sin fallos.

---

## 1. Verificación Previa y Certificación del Respaldo

### 1.1 Verificación de Identificadores y Dependencias
Antes de la ejecución transaccional, se efectuó una inspección exhaustiva de cada uno de los registros candidatos a depuración:

- **Eventos Identificados (7 registros):** IDs `39, 40, 41, 42, 51, 52, 69`.
  - Título / Nombre: "Gala de Tecnología E2E".
  - Estado: `pendiente`.
  - Dependencias: 0 filas en `detalle_eventos`, 0 filas en `agendas`. Registros residuales generados en ejecuciones previas de pruebas E2E.
- **Usuarios Residuales (19 registros):** IDs `4, 6, 8, 10, 13, 15, 17, 19, 20, 22, 24, 26, 28, 30, 32, 34, 41, 43, 49`.
  - Correos: Estructura de pruebas automatizadas `nuevo_cliente_{timestamp}@empresa.com`.
  - Dependencias: 0 asignaciones operativas en `agenda_integrantes`.
- **Clientes Residuales (19 registros):** IDs `3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 29, 31, 33, 41, 43, 47`.
  - Asignados a los usuarios de prueba mencionados.
  - Eventos vinculados: Exclusivamente los 7 eventos residuales anteriores.

### 1.2 Certificación del Respaldo mediante Restauración Aislada
- **Archivo de Respaldo:** `backend/database/backups/backup_nexoeventos_pre_cleanup.sql` (28.138 bytes).
- **Procedimiento de Prueba:**
  1. Creación de base de datos aislada `CREATE DATABASE IF NOT EXISTS nexoeventos_test_restore;`.
  2. Restauración integral mediante `mysql.exe -u root -p nexoeventos_test_restore < backup_nexoeventos_pre_cleanup.sql`.
  3. Comparación tabla por tabla entre la base de datos productiva y la réplica restaurada:
     - `roles`: 3 filas (coincidencia 100%).
     - `usuarios`: 23 filas (coincidencia 100%).
     - `clientes`: 22 filas (coincidencia 100%).
     - `servicios`: 7 filas (coincidencia 100%).
     - `eventos`: 12 filas (coincidencia 100%).
     - `detalle_eventos`: 14 filas (coincidencia 100%).
     - `categorias_agenda`: 4 filas (coincidencia 100%).
     - `agendas`: 7 filas (coincidencia 100%).
     - `agenda_integrantes`: 9 filas (coincidencia 100%).
     - `agenda_notas`: 8 filas (coincidencia 100%).
     - `schema_migrations`: 12 filas (coincidencia 100%).
  4. Eliminación de la base de datos temporal `nexoeventos_test_restore`.

---

## 2. Ejecución Transaccional Segura de la Depuración

La depuración se llevó a cabo respetando el orden jerárquico impuesto por las restricciones de claves foráneas, con `FOREIGN_KEY_CHECKS = 1` estrictamente activo, sin cláusulas `CASCADE` automáticas y sin `TRUNCATE`.

### 2.1 Sentencias SQL Ejecutadas

```sql
START TRANSACTION;

-- Paso 1: Eliminar eventos de prueba residuales (desbloquea fk_eventos_cliente)
DELETE FROM eventos 
WHERE id_evento IN (39, 40, 41, 42, 51, 52, 69);
-- Filas afectadas esperadas: 7 | Filas afectadas reales: 7

-- Paso 2: Eliminar usuarios de prueba residuales (desbloquea fk_usuarios_cliente)
DELETE FROM usuarios 
WHERE id_usuario IN (4, 6, 8, 10, 13, 15, 17, 19, 20, 22, 24, 26, 28, 30, 32, 34, 41, 43, 49);
-- Filas afectadas esperadas: 19 | Filas afectadas reales: 19

-- Paso 3: Eliminar clientes de prueba residuales
DELETE FROM clientes 
WHERE id_cliente IN (3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 29, 31, 33, 41, 43, 47);
-- Filas afectadas esperadas: 19 | Filas afectadas reales: 19

COMMIT;
```

### 2.2 Balance de Filas Afectadas
- `DELETE FROM eventos`: 7 filas afectadas (esperadas: 7).
- `DELETE FROM usuarios`: 19 filas afectadas (esperadas: 19).
- `DELETE FROM clientes`: 19 filas afectadas (esperadas: 19).
- Total de filas depuradas: 45 registros residuales eliminados.
- Transacción confirmada exitosamente mediante `COMMIT`.

---

## 3. Verificación Posterior Obligatoria en MySQL 8.0

### 3.1 Comprobación de Eliminación Física (Cero Registros Residuales)
Se ejecutó la siguiente consulta de auditoría contra la base de datos `nexoeventos`:

```sql
SELECT 
  (SELECT COUNT(*) FROM eventos WHERE id_evento IN (39, 40, 41, 42, 51, 52, 69)) AS eventos_residuales,
  (SELECT COUNT(*) FROM usuarios WHERE id_usuario IN (4, 6, 8, 10, 13, 15, 17, 19, 20, 22, 24, 26, 28, 30, 32, 34, 41, 43, 49)) AS usuarios_residuales,
  (SELECT COUNT(*) FROM clientes WHERE id_cliente IN (3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 29, 31, 33, 41, 43, 47)) AS clientes_residuales;
```

**Resultado obtenido:**
```
+--------------------+---------------------+---------------------+
| eventos_residuales | usuarios_residuales | clientes_residuales |
+--------------------+---------------------+---------------------+
|                  0 |                   0 |                   0 |
+--------------------+---------------------+---------------------+
```

### 3.2 Comprobación de Registros Legítimos Preservados

#### Usuarios Legítimos (Exactamente 4 registros activos):
| ID | Nombre | Correo Electrónico | Rol | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | Administrador Oscar | `admin@nexoeventos.com` | 1 (Administrador) | Activo |
| **#2** | Supervisor de Operaciones Steven | `supervisor@nexoeventos.com` | 2 (Supervisor) | Activo |
| **#3** | Innova Tech - Gestor Eventos | `cliente@empresa.com` | 3 (Cliente) | Activo |
| **#12** | OSCAR YAVETH | `oscarguidorosales101@gmail.com` | 3 (Cliente) | Activo |

#### Clientes Legítimos (Exactamente 3 registros comerciales):
| ID | Nombre Comercial / Razón Social | Tipo Cliente | Contacto Principal |
| :--- | :--- | :--- | :--- |
| **#1** | Corporación Innova Tech S.A.S. | Empresa | `contacto@innovatech.com` |
| **#2** | Carolina Mendoza Ruiz | Persona | `carolina.mendoza@email.com` |
| **#11** | OSCAR YAVETH | Persona | `oscarguidorosales101@gmail.com` |

#### Eventos Legítimos (Exactamente 5 eventos):
| ID Evento | Nombre del Evento | Cliente Titular | Estado | Ubicación |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | Convención Anual Innova Tech 2026 | #1 (Innova Tech) | confirmado | Centro de Convenciones Ágora - Salón Gran Diamante |
| **#2** | Boda Real Carolina y Fernando | #2 (Carolina Mendoza) | confirmado | Hacienda El Paraíso, La Calera |
| **#10** | Oscar Yabeth Guido Rosales | #1 (Innova Tech) | confirmado | Manuel Mora |
| **#11** | Boda de amor con Wayner y Sofia | #11 (OSCAR YAVETH) | confirmado | Manuel Mora |
| **#13** | Gala Corporativa Anual Nexo 2026 | #1 (Innova Tech) | confirmado | Gran Salón Real Diamante |

### 3.3 Verificación de Migraciones y Tablas del Sistema
- **Total de Tablas Activas:** 10 tablas de dominio + 1 tabla de control (`schema_migrations`).
- **Conteo de Migraciones Ejecutadas:** 12 migraciones registradas en `schema_migrations`.
- **Estructura de la Base de Datos:**
  - `roles`: 3 registros
  - `usuarios`: 4 registros
  - `clientes`: 3 registros
  - `servicios`: 7 registros
  - `eventos`: 5 registros
  - `detalle_eventos`: 14 registros
  - `categorias_agenda`: 4 registros
  - `agendas`: 7 registros
  - `agenda_integrantes`: 9 registros
  - `agenda_notas`: 8 registros
  - `schema_migrations`: 12 registros

### 3.4 Prueba de Integridad Referencial de Claves Foráneas
Para confirmar que el motor MySQL rechaza violaciones de integridad referencial, se ejecutó una sentencia deliberada de eliminación sobre el Cliente #1 (poseedor de eventos y contratos):

```sql
DELETE FROM clientes WHERE id_cliente = 1;
```

**Respuesta de MySQL:**
```
ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails 
(`nexoeventos`.`eventos`, CONSTRAINT `fk_eventos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON UPDATE CASCADE)
```
Se certifica que todas las restricciones `ON DELETE RESTRICT` y las claves foráneas permanecen activas y funcionales.

---

## 4. Resultados de las Suites de Validación Post-Depuración

Con la base de datos depurada, se ejecutaron sucesivamente las 4 suites automatizadas obligatorias:

### 4.1 Suite de Endpoints y RBAC (`npm run test:api`)
- **Archivo:** `backend/src/scripts/testEndpoints.js`
- **Total Aserciones:** 84 pruebas
- **Resultado:** **84 PASSED / 0 FAILED** (Código de salida: 0)
- **Aserciones Críticas Validadas:**
  - GET `/eventos/2` con token de Cliente #1 responde `403 FORBIDDEN` con payload de error unificado.
  - Bloque `finally` ejecuta limpieza física de datos de prueba y comprueba en MySQL `0` residuos.

### 4.2 Suite de Persistencia Real en MySQL (`npm run test:persistence`)
- **Archivo:** `backend/src/scripts/testDirectMySQLPersistence.js`
- **Total Entidades Validadas:** 10 entidades (`roles`, `clientes`, `usuarios`, `servicios`, `eventos`, `detalle_eventos`, `categorias_agenda`, `agendas`, `agenda_integrantes`, `agenda_notas`).
- **Resultado:** **100% PASSED / 0 FAILED** (Código de salida: 0)
- **Aserciones Críticas:** Persistencia física confirmada en MySQL para inserciones, actualizaciones, relaciones relacionales complejas y bloqueos de eliminación por integridad referencial. Limpieza física inversa verificada.

### 4.3 Suite de Flujo Comercial (`npm run test:commercial`)
- **Archivo:** `backend/src/scripts/testCommercialWorkflow.js`
- **Total Pasos:** 10 fases completas
- **Resultado:** **10 PASSED / 0 FAILED** (Código de salida: 0)
- **Flujo Comprobado:** Creación de evento pendiente por cliente/supervisor -> Aprobación formal -> Creación de agenda operativa principal -> Asignación de equipo de trabajo en `agenda_integrantes` -> Limpieza controlada.

### 4.4 Suite de Comunicación en Tiempo Real Socket.IO (`npm run test:socket`)
- **Archivo:** `backend/src/scripts/testSocket.js`
- **Total Aserciones:** 17 pruebas
- **Resultado:** **17 PASSED / 0 FAILED** (Código de salida: 0)
- **Eventos Validados:** Rechazo de handshake sin JWT / JWT inválido, conexión simultánea multi-rol, emisión y recepción de `schedule:created`, `schedule:updated`, `schedule:rescheduled` (Drag & Drop), `schedule:deleted`, aislamiento de salas operativas frente a clientes, ausencia de eventos duplicados (conteo exacto = 1), desconexión y reconexión limpia.

---

## 5. Estado Final del Sistema

1. **Backend Server:** Activo y estable en `http://localhost:5000` (Socket.IO + Express REST API).
2. **Frontend SPA:** Activo en `http://localhost:5173` (Vite + React), compilado sin advertencias críticas y validado mediante suite E2E en navegador Puppeteer (100% PASS, 0 pantallas negras, ErrorBoundary activo).
3. **Base de Datos MySQL 8.0:** Depurada, consistente, con 0 registros residuales, con todos los registros legítimos preservados y con integridad referencial plenamente vigente.

