# NEXOEVENTOS — INFORME DE OPTIMIZACIÓN CONTROLADA, SUITE SOCKET.IO E INVENTARIO DE REGISTROS

**Fecha de ejecución:** 5 de noviembre de 2026  
**Estado:** Puntos 1 y 3 completados y validados. Punto 2 (depuración MySQL) en espera de aprobación con respaldo de seguridad generado.

---

## 1. Resumen de Acciones Ejecutadas

Conforme a la autorización y condiciones obligatorias recibidas:

1. **Corrección de `testEndpoints.js`:**
   - Se corrigió la aserción de aislamiento de clientes (Sección 15.3). Ahora evalúa de manera estricta el acceso del Cliente 1 (`id_cliente = 1`) al Evento 2 (`id_evento = 2`, perteneciente a la Cliente 2, Carolina Mendoza), exigiendo código HTTP 403 y código interno `FORBIDDEN`.
   - Se implementó un rastreador en memoria (`testCreatedIds`) que captura exclusivamente los identificadores generados por la corrida actual.
   - Se encapsuló la ejecución en un bloque `try ... catch ... finally` que elimina de manera ordenada los registros creados durante la prueba y comprueba directamente en MySQL (`pool.query()`) que no persista ningún registro residual generado por la suite.
   - Se cerró limpiamente la conexión a MySQL con `await pool.end()`.

2. **Implementación de `testSocket.js` y comando `npm run test:socket`:**
   - Se incorporó la dependencia de desarrollo `socket.io-client` y el script permanente `backend/src/scripts/testSocket.js`.
   - Se validaron 17 aserciones en tiempo real mediante dos sesiones simultáneas autenticadas (`Admin` y `Supervisor`) más una tercera sesión de `Cliente` para comprobar el aislamiento de información entre roles.
   - Valida: rechazo de conexiones sin JWT o con token corrupto, conexión simultánea, emisión y recepción de `schedule:created`, `schedule:updated`, reprogramación `schedule:rescheduled` (Drag & Drop), `schedule:deleted`, ausencia de eventos duplicados, y desconexión/reconexión limpia.

3. **Generación de Respaldo de Seguridad de MySQL:**
   - Se ejecutó `mysqldump` sobre la base de datos `nexoeventos` exportando esquemas, datos, rutinas y disparadores.
   - Archivo generado: `backend/database/backups/backup_nexoeventos_pre_cleanup.sql` (28.048 bytes).

4. **Inventario Completo de Registros en MySQL:**
   - Se inspeccionaron individualmente los 23 usuarios y 22 clientes presentes en la base de datos para diferenciar registros legítimos/semilla de artefactos de prueba acumulados previamente.

---

## 2. Inventario Detallado de Registros en MySQL 8.0

### 2.1 Usuarios y Clientes Legítimos / Semilla (NO ELIMINAR)

| ID Usuario | Correo | Rol | ID Cliente | Nombre Cliente | Dependencias / Justificación | Clasificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | `admin@nexoeventos.com` | Administrador | NULL | N/A | Responsable en 3 agendas, integrante en 4 agendas. Cuenta principal del sistema. | **LEGÍTIMO (Sistema)** |
| **#2** | `supervisor@nexoeventos.com` | Supervisor | NULL | N/A | Responsable en 4 agendas, integrante en 5 agendas. Cuenta operativa. | **LEGÍTIMO (Sistema)** |
| **#3** | `cliente@empresa.com` | Cliente | #1 | Corporación Innova Tech S.A.S. | Posee 3 eventos (#1, #10, #13) y agendas vinculadas. Datos de semilla comercial. | **LEGÍTIMO (Semilla)** |
| N/A | `carolina.mendoza@email.com` | N/A | #2 | Carolina Mendoza Ruiz | Posee 1 evento (#2: 'Boda Real Carolina y Fernando') con detalles y agenda. | **LEGÍTIMO (Semilla)** |
| **#12** | `oscarguidorosales101@gmail.com` | Cliente | #11 | OSCAR YAVETH | Posee 1 evento (#11: 'Boda de amor con Wayner y Sofia'). Creado por el usuario. | **LEGÍTIMO (Usuario)** |

### 2.2 Registros de Prueba Residuales Detectados (Propuesta de Depuración)

Los siguientes 19 usuarios y 19 clientes fueron generados por ejecuciones anteriores de pruebas automatizadas antes de implementar la limpieza estricta en `testEndpoints.js`:

| ID Usuario | Correo de Prueba | ID Cliente | Dependencias / Eventos | Operación Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| **#4** | `nuevo_cliente_1793892618779@empresa.com` | #3 | 0 eventos, 0 agendas | Eliminar Usuario #4 y Cliente #3 |
| **#6** | `nuevo_cliente_1793893413846@empresa.com` | #5 | 0 eventos, 0 agendas | Eliminar Usuario #6 y Cliente #5 |
| **#8** | `nuevo_cliente_1793897022084@empresa.com` | #7 | 0 eventos, 0 agendas | Eliminar Usuario #8 y Cliente #7 |
| **#10** | `nuevo_cliente_1793897238976@empresa.com` | #9 | 0 eventos, 0 agendas | Eliminar Usuario #10 y Cliente #9 |
| **#13** | `nuevo_cliente_1793897374857@empresa.com` | #12 | 0 eventos, 0 agendas | Eliminar Usuario #13 y Cliente #12 |
| **#15** | `nuevo_cliente_1793897395164@empresa.com` | #14 | 0 eventos, 0 agendas | Eliminar Usuario #15 y Cliente #14 |
| **#17** | `nuevo_cliente_1793897422560@empresa.com` | #16 | 0 eventos, 0 agendas | Eliminar Usuario #17 y Cliente #16 |
| **#19** | `nuevo_cliente_1793901400735@empresa.com` | #18 | 0 eventos, 0 agendas | Eliminar Usuario #19 y Cliente #18 |
| **#20** | `nuevo_cliente_1793901496415@empresa.com` | #19 | 0 eventos, 0 agendas | Eliminar Usuario #20 y Cliente #19 |
| **#22** | `nuevo_cliente_1793901632619@empresa.com` | #21 | 0 eventos, 0 agendas | Eliminar Usuario #22 y Cliente #21 |
| **#24** | `nuevo_cliente_1793901728069@empresa.com` | #23 | 0 eventos, 0 agendas | Eliminar Usuario #24 y Cliente #23 |
| **#26** | `nuevo_cliente_1793905918481@empresa.com` | #25 | 0 eventos, 0 agendas | Eliminar Usuario #26 y Cliente #25 |
| **#28** | `nuevo_cliente_1793905981274@empresa.com` | #27 | 0 eventos, 0 agendas | Eliminar Usuario #28 y Cliente #27 |
| **#30** | `nuevo_cliente_1793906246911@empresa.com` | #29 | 0 eventos, 0 agendas | Eliminar Usuario #30 y Cliente #29 |
| **#32** | `nuevo_cliente_1793906282350@empresa.com` | #31 | 0 eventos, 0 agendas | Eliminar Usuario #32 y Cliente #31 |
| **#34** | `nuevo_cliente_1793906334500@empresa.com` | #33 | 4 eventos huérfanos (#39, #40, #41, #42: 'Gala de Tecnología E2E' en estado pendiente, 0 detalles, 0 agendas) | Eliminar Eventos 39, 40, 41, 42, luego Usuario #34 y Cliente #33 |
| **#41** | `nuevo_cliente_1793908069072@empresa.com` | #41 | 0 eventos, 0 agendas | Eliminar Usuario #41 y Cliente #41 |
| **#43** | `nuevo_cliente_1793908273943@empresa.com` | #43 | 2 eventos huérfanos (#51, #52: 'Gala de Tecnología E2E' en estado pendiente, 0 detalles, 0 agendas) | Eliminar Eventos 51, 52, luego Usuario #43 y Cliente #43 |
| **#49** | `nuevo_cliente_1793910508870@empresa.com` | #47 | 0 eventos, 0 agendas | Eliminar Usuario #49 y Cliente #47 |

### 2.3 Sentencias de Eliminación Propuestas (En espera de autorización)

Para asegurar la integridad referencial y no afectar ninguna clave foránea, el orden estricto de ejecución propuesto es:

```sql
-- 1. Eliminar eventos de prueba residuales creados por pruebas anteriores de navegador
DELETE FROM eventos WHERE id_evento IN (39, 40, 41, 42, 51, 52);

-- 2. Eliminar usuarios residuales de prueba
DELETE FROM usuarios WHERE id_usuario IN (4, 6, 8, 10, 13, 15, 17, 19, 20, 22, 24, 26, 28, 30, 32, 34, 41, 43, 49);

-- 3. Eliminar clientes residuales de prueba
DELETE FROM clientes WHERE id_cliente IN (3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 29, 31, 33, 41, 43, 47);
```

> [!NOTE]
> Estas operaciones **NO han sido ejecutadas**. Se mantendrán congeladas a la espera de su confirmación explícita. El respaldo íntegro de la base de datos se encuentra preservado en `backend/database/backups/backup_nexoeventos_pre_cleanup.sql`.

---

## 3. Resultados Reales de la Validación Final

Se ejecutaron de manera consecutiva las 6 suites de validación del proyecto:

### 3.1 Suite de Endpoints y RBAC (`npm run test:api`)
- **Comando:** `npm run test:api` (en `NexoEventos/backend`)
- **Aserciones ejecutadas:** 84 aserciones
- **Resultado:** **84 PASSED / 0 FAILED** (Código de salida: 0)
- **Evidencia destacada:**
  - `[PASS] Cliente restringido de acceder a información de eventos ajenos (GET /eventos/2 responde 403 FORBIDDEN)`
  - `[PASS] Verificación directa en MySQL: 0 registros residuales creados por esta suite`

### 3.2 Suite de Persistencia Real en MySQL (`npm run test:persistence`)
- **Comando:** `npm run test:persistence` (en `NexoEventos/backend`)
- **Aserciones ejecutadas:** 36 aserciones directas contra MySQL 8.0
- **Resultado:** **100 % PASSED / 0 FAILED** (Código de salida: 0)
- **Entidades verificadas:** `roles`, `clientes`, `usuarios`, `servicios`, `eventos`, `detalle_eventos`, `categorias_agenda`, `agendas`, `agenda_integrantes`, `agenda_notas`.
- **Limpieza:** Limpieza física inversa verificada con `pool.query()`.

### 3.3 Suite de Flujo Comercial (`npm run test:commercial`)
- **Comando:** `npm run test:commercial` (en `NexoEventos/backend`)
- **Resultado:** **10 Pasos PASSED / 0 FAILED** (Código de salida: 0)
- **Validación:** Creación de evento pendiente -> Aprobación por supervisor -> Vinculación de agenda -> Asignación de integrantes en `agenda_integrantes` -> Limpieza de registros de prueba.

### 3.4 Suite de Tiempo Real Socket.IO (`npm run test:socket`)
- **Comando:** `npm run test:socket` (en `NexoEventos/backend`)
- **Aserciones ejecutadas:** 17 aserciones
- **Resultado:** **17 PASSED / 0 FAILED** (Código de salida: 0)
- **Evidencia destacada:**
  - Handshake sin JWT y con token inválido rechazado en middleware.
  - Recepción de `schedule:created`, `schedule:updated`, `schedule:rescheduled` (Drag & Drop) y `schedule:deleted` por parte del Supervisor conectado simultáneamente.
  - Aislamiento de rol verificado: Cliente conectado no recibe eventos de actividades internas de staff.
  - Ausencia de eventos duplicados (conteo exacto = 1).
  - Desconexión y reconexión limpia.

### 3.5 Suite de Navegación E2E en Navegador (`npm run test:e2e`)
- **Comando:** `npm run test:e2e` (en `NexoEventos/frontend`)
- **Resultado:** **100 % PASSED / 0 FAILED** (Código de salida: 0)
- **Validación:** Login de Administrador, visualización de dashboard (0 pantallas negras, ErrorBoundary activo, `ShieldCheck` resuelto), apertura de modal relacional de eventos, creación, edición, borrado mediante `ConfirmModal`, vista semanal de calendario, login de Supervisor con restricción protegida a `/usuarios`, login de Cliente con visualización de `/portal-cliente`. Consola de navegador con 0 errores JavaScript.

### 3.6 Compilación de Producción Frontend (`npm run build`)
- **Comando:** `npm run build` (en `NexoEventos/frontend`)
- **Herramienta:** Vite v6.4.5
- **Resultado:** Compilación exitosa en 4.15s (Código de salida: 0)
- **Archivos generados:**
  - `dist/index.html` (0.96 kB)
  - `dist/assets/index-Dw-5VB8F.css` (19.60 kB)
  - `dist/assets/index-jMLjogx7.js` (403.96 kB)

---

## 4. Archivos Modificados y Creados

1. `NexoEventos/backend/package.json` (Modificado):
   - Adición del script `"test:socket": "node src/scripts/testSocket.js"`.
   - Adición de `socket.io-client` en `devDependencies`.
2. `NexoEventos/backend/src/scripts/testEndpoints.js` (Modificado):
   - Corrección de la prueba de aislamiento de clientes (Sección 15.3) hacia `/eventos/2`.
   - Implementación del rastreador `testCreatedIds` y bloque `finally` con limpieza segura y aserción directa en MySQL de cero residuos.
3. `NexoEventos/backend/src/scripts/testSocket.js` (Creado):
   - Suite permanente de pruebas de tiempo real con dos sesiones simultáneas WebSocket.
4. `NexoEventos/backend/database/backups/backup_nexoeventos_pre_cleanup.sql` (Creado):
   - Respaldo de seguridad completo previo a cualquier modificación de datos.
5. `NexoEventos/docs/informe-optimizacion-y-depuracion.md` (Creado):
   - Registro técnico integral del proceso, inventario y evidencias.

---

## 5. Problemas Pendientes

Ninguno a nivel funcional, de seguridad ni de arquitectura de código. La totalidad de las 6 suites se ejecutan con 0 errores y el sistema opera al 100 %.

El único elemento pendiente es la **decisión y aprobación de la eliminación de los 19 registros residuales identificados** en la base de datos MySQL, según la propuesta presentada en la Sección 2.3.

