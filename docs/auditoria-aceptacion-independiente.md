# NEXOEVENTOS — AUDITORÍA INDEPENDIENTE DE ACEPTACIÓN FINAL

## Resumen Ejecutivo de la Auditoría

La presente auditoría técnica independiente fue ejecutada con un criterio estricto, no complaciente y basado exclusivamente en evidencias reproducibles sobre el código fuente, la base de datos MySQL 8.0 y la navegación en navegador real del proyecto **NexoEventos**.

A diferencia de evaluaciones preliminares que declararon un 100 % de conformidad sin contrastar la calidad interna de las pruebas, esta auditoría examinó de manera pormenorizada:
1. La validez de las suites de pruebas existentes (`testEndpoints.js`, `testDirectMySQLPersistence.js`, `testCommercialWorkflow.js`, `testBrowserE2E.js`), identificando falsos positivos, pruebas incompletas y generación de datos huérfanos.
2. La arquitectura física y relacional de MySQL 8.0, incluyendo índices funcionales únicos, restricciones de clave foránea y comportamiento transaccional.
3. El control de acceso basado en roles (RBAC) mediante solicitudes HTTP directas con tokens JWT reales para Administrador, Supervisor y Cliente, comprobando la inmutabilidad de la base de datos ante intentos de vulneración.
4. El subsistema de Calendario y comunicación en tiempo real con Socket.IO, validando la recepción asíncrona de eventos entre dos clientes conectados simultáneamente.
5. El comportamiento visual y funcional de la interfaz en Google Chrome headless (Puppeteer), certificando la eliminación definitiva de la pantalla negra del administrador y la respuesta de los formularios y controles modales.

### Resultado Global del Dictamen
- **Arquitectura de Software y Base de Datos:** Correcta y verificada. El modelo de datos, las relaciones relacionales de 10 entidades y la restricción funcional `uq_evento_agenda_principal` operan conforme a las especificaciones.
- **Seguridad y RBAC:** Correcta y verificada. Ningún rol secundario puede escalar privilegios ni acceder a información de otros inquilinos (multitenant isolation estricto).
- **Tiempo Real y Calendario:** Correcto y verificado mediante prueba de dos sesiones simultáneas WebSocket.
- **Suites de Pruebas Originales:** Se detectaron **dos deficiencias metodológicas y una omisión** en `testEndpoints.js` (acumulación de usuarios de prueba no limpiados en MySQL, prueba de aislamiento con falso positivo potencial y validación de Socket.IO limitada al apretón de manos HTTP).

---

## 1. Matriz de Evaluación Independiente

| Área | Prueba | Resultado | Evidencia | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Suites de Pruebas** | Limpieza de datos en `testEndpoints.js` | Deficiente: Acumulación de registros huérfanos en `usuarios` y `clientes` | Se localizaron 16 registros tipo `nuevo_cliente_...@empresa.com` persistidos permanentemente en MySQL | **Incompleto** |
| **Suites de Pruebas** | Aislamiento en `testEndpoints.js` (Sec. 15.3) | Falso positivo: Evalúa evento 1 con cliente 1 bajo condición disyuntiva `status === 403 \|\| (status === 200 && data.id_cliente === 1)` | No evaluaba la consulta de un evento ajeno (p. ej. evento 2 perteneciente al cliente 2) | **Incorrecto** |
| **Suites de Pruebas** | Prueba de Socket.IO en `testEndpoints.js` (Sec. 15.7) | Cobertura parcial: Solo verifica handshake HTTP de polling | La prueba no establece conexión WebSocket ni evalúa recepción bidireccional entre sesiones | **Incompleto** |
| **Suites de Pruebas** | Persistencia real en `testDirectMySQLPersistence.js` | Satisfactorio: Validación directa en MySQL para 10 entidades con limpieza estricta | 100 % de aserciones validadas contra `pool.query()`, sin mocks y con limpieza inversa completa | **Correcto y verificado** |
| **Suites de Pruebas** | Flujo comercial en `testCommercialWorkflow.js` | Satisfactorio: Aprobación de evento, asignación de agenda e integridad de equipo | Creación, aprobación por supervisor, vinculación de agenda y verificación de claves foráneas con limpieza | **Correcto y verificado** |
| **Suites de Pruebas** | Navegación e2e en navegador (`testBrowserE2E.js`) | Satisfactorio: Flujo completo en Chromium headless para 3 roles | Login de Admin, Supervisor y Cliente, CRUD de eventos en interfaz, 0 pantallas negras, 0 excepciones JS | **Correcto y verificado** |
| **MySQL 8.0** | Integridad de catálogo de 10 tablas + migraciones | Satisfactorio: 10 tablas requeridas + `schema_migrations` con 12 migraciones aplicadas | `SHOW TABLES` reporta 11 tablas; `schema_migrations` reporta 12 registros cronológicos | **Correcto y verificado** |
| **MySQL 8.0** | Índice funcional `uq_evento_agenda_principal` | Satisfactorio: Restricción física en tabla `agendas` | `Non_unique: 0`, Expresión: `(case when id_categoria = 1 and id_evento is not null then id_evento else null end)` | **Correcto y verificado** |
| **MySQL 8.0** | Bloqueo de duplicación de agenda principal | Satisfactorio: MySQL rechaza segundo insert con error `ER_DUP_ENTRY` | Rechazado con mensaje: `Duplicate entry '1' for key 'agendas.uq_evento_agenda_principal'` | **Correcto y verificado** |
| **MySQL 8.0** | Concurrencia de actividades secundarias | Satisfactorio: Permite múltiples agendas secundarias para el mismo evento | Inserción sin colisión de categorías 2 (Meeting) y 3 (Setup and Rehearsal) para el evento #1 | **Correcto y verificado** |
| **MySQL 8.0** | Integridad referencial en eliminación de clientes | Satisfactorio: Bloqueo de borrado de cliente con eventos activos | Error MySQL `ER_ROW_IS_REFERENCED_2` al ejecutar `DELETE FROM clientes WHERE id_cliente = 1` | **Correcto y verificado** |
| **MySQL 8.0** | Integridad referencial en servicios contratados | Satisfactorio: Bloqueo de borrado de servicio con contrataciones | Error MySQL `ER_ROW_IS_REFERENCED_2` al intentar eliminar servicio #6 contratado en `detalle_eventos` | **Correcto y verificado** |
| **MySQL 8.0** | Integridad referencial en eventos con detalles | Satisfactorio: Bloqueo de borrado de evento con servicios asociados | Error MySQL `ER_ROW_IS_REFERENCED_2` al intentar eliminar evento #1 con filas en `detalle_eventos` | **Correcto y verificado** |
| **MySQL 8.0** | Integridad en `agenda_integrantes` y `agenda_notas` | Satisfactorio: Relaciones válidas hacia usuarios, roles y agendas | 9 relaciones de equipo y 8 notas operativas verificadas con integridad referencial | **Correcto y verificado** |
| **Seguridad RBAC** | Protección de rutas sin autenticación | Satisfactorio: Rechazo con código HTTP 401 Unauthorized | Peticiones a `/api/eventos` sin token, con token corrupto o con firma alterada devuelven 401 | **Correcto y verificado** |
| **Seguridad RBAC** | Restricción de Supervisor sobre Usuarios | Satisfactorio: Supervisor bloqueado con HTTP 403 Forbidden | Métodos GET, POST, PUT y DELETE sobre `/api/usuarios` devuelven 403 unificado | **Correcto y verificado** |
| **Seguridad RBAC** | Restricción de Supervisor sobre Roles | Satisfactorio: Supervisor bloqueado con HTTP 403 Forbidden | Métodos GET, POST y PUT sobre `/api/roles` devuelven 403 Forbidden | **Correcto y verificado** |
| **Seguridad RBAC** | Restricciones de Cliente sobre Catálogos y Usuarios | Satisfactorio: Cliente bloqueado con HTTP 403 Forbidden | Métodos sobre `/api/usuarios`, `/api/roles` y `/api/servicios` devuelven 403 Forbidden | **Correcto y verificado** |
| **Seguridad RBAC** | Aislamiento Multitenant de Eventos de Cliente | Satisfactorio: Cliente 1 no puede leer, modificar ni borrar eventos del Cliente 2 | Peticiones GET, PUT y DELETE a `/api/eventos/2` devuelven 403 Forbidden | **Correcto y verificado** |
| **Seguridad RBAC** | Aislamiento Multitenant en Ficha de Clientes | Satisfactorio: Cliente 1 bloqueado de consultar `/api/clientes/2` | Petición devuelve 403 Forbidden | **Correcto y verificado** |
| **Seguridad RBAC** | Filtrado contextual de eventos de Cliente | Satisfactorio: GET `/api/eventos` para Cliente devuelve únicamente eventos propios | Retorna exactamente 3 eventos donde `id_cliente = 1`, ocultando eventos de clientes 2, 11 y 33 | **Correcto y verificado** |
| **Seguridad RBAC** | Acceso global del Administrador | Satisfactorio: Acceso irrestricto con 200 OK | Retorna totalidad de 10 eventos, 3 roles y catálogo de usuarios | **Correcto y verificado** |
| **Seguridad RBAC** | Inmutabilidad de MySQL ante ataques simulados | Satisfactorio: Estado de la base de datos inalterado | Fila `hacker@test.com` count = 0; Rol 1 = 'administrador'; Evento 2 no fue modificado | **Correcto y verificado** |
| **Calendario** | Vista Semanal (Lunes a Domingo) | Satisfactorio: Rango de 7 días iniciando formalmente en Lunes | `/api/schedules/week` retorna 7 columnas con cálculo exacto de inicio de semana | **Correcto y verificado** |
| **Calendario** | Vista Diaria y Resumen de Contadores | Satisfactorio: Desglose por horas y métricas agrupadas | `/api/schedules/day` retorna detalle del día; `/api/schedules/summary` retorna contadores por categoría | **Correcto y verificado** |
| **Calendario** | Zona horaria `America/Costa_Rica` | Satisfactorio: Configurada en backend y exportación iCalendar | `/api/health` e iCalendar (.ics) declaran explícitamente `TZID:America/Costa_Rica` | **Correcto y verificado** |
| **Calendario** | Reprogramación y Detección de Conflictos | Satisfactorio: PATCH `/reschedule` y prevención de colisión horaria | Responde 200 OK ante horarios libres y 409 CONFLICT ante solapamientos de integrantes | **Correcto y verificado** |
| **Calendario** | Exportación estándar iCalendar RFC 5545 | Satisfactorio: Formato `.ics` válido y descargable | Estructura con `BEGIN:VCALENDAR`, `SUMMARY`, `DTSTART`, `DTEND`, `UID` y `END:VCALENDAR` | **Correcto y verificado** |
| **Socket.IO** | Comunicación en tiempo real con 2 sesiones | Satisfactorio: Transmisión asíncrona entre Cliente A (Admin) y Cliente B (Supervisor) | Cliente B recibió en vivo: `schedule:created`, `schedule:rescheduled`, `schedule:updated` y `schedule:deleted` | **Correcto y verificado** |
| **Interfaz UI** | Resolución de pantalla negra en Administrador | Satisfactorio: Dashboard corporativo renderiza sin fallos | Ausencia de error `ShieldCheck is not defined`, tarjetas KPI visibles, ErrorBoundary operativo | **Correcto y verificado** |
| **Interfaz UI** | Interacción modal y CRUD de eventos en navegador | Satisfactorio: Modal abre con datos relacionales, guarda y elimina | Formulario interactivo crea evento, actualiza tabla, abre `ConfirmModal` y remueve fila | **Correcto y verificado** |
| **Interfaz UI** | Protección de rutas privadas en frontend | Satisfactorio: Redirección o denegación limpia sin ruptura de SPA | Supervisor navegando forzadamente a `/usuarios` recibe denegación sin fallo en consola | **Correcto y verificado** |

---

## 2. Análisis Crítico de la Suite de Pruebas Existente

Al auditar el código fuente de los scripts de prueba dentro de `NexoEventos/backend/src/scripts/` y `NexoEventos/frontend/src/scripts/`, se obtuvieron las siguientes conclusiones:

### 2.1 Archivo: `testEndpoints.js` (887 líneas, 83 aserciones)
- **Mocks utilizados:** Ninguno. Todas las peticiones emplean `fetch` nativo contra los endpoints HTTP del backend.
- **Deficiencia 1 — Generación de Datos Huérfanos:**
  En la Sección 3 (líneas 99-112), se ejecuta el registro de un cliente automatizado:
  ```javascript
  const uniqueMail = `nuevo_cliente_${Date.now()}@empresa.com`;
  const registerOk = await request('/auth/register', { ... });
  ```
  Este registro crea una tupla en `usuarios` y otra en `clientes`. Al finalizar la suite de pruebas, **dicho registro no es eliminado**. Tras múltiples ejecuciones de pruebas previas, la base de datos acumuló 16 registros residuales en las tablas `usuarios` y `clientes`.
- **Deficiencia 2 — Falso Positivo Metodológico en Aislamiento de Clientes:**
  En la Sección 15.3 (líneas 841-850), la prueba declara verificar que un cliente está restringido de acceder a información de eventos ajenos. El código implementado fue:
  ```javascript
  const alienEventRes = await request('/eventos/1', {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert(
    alienEventRes.status === 403 || (alienEventRes.status === 200 && alienEventRes.data?.data?.id_cliente === 1),
    'Cliente restringido de acceder a información de eventos ajenos'
  );
  ```
  Dado que `clientToken` pertenece a `cliente@empresa.com` (cuyo `id_cliente` es precisamente 1), la petición a `/eventos/1` devuelve HTTP 200 con su propio evento. La aserción aprobó debido a la cláusula `||`, **sin haber probado jamás el acceso a un evento de un tercero** (como el evento #2, perteneciente al cliente #2).
  *Nota de auditoría:* En la auditoría independiente realizada por fuera de esta suite, se ejecutó `GET /api/eventos/2` con las credenciales del cliente 1 y el backend sí respondió correctamente HTTP 403 Forbidden. Por tanto, el backend es seguro, pero la prueba original contenía un falso positivo de diseño.
- **Deficiencia 3 — Comprobación Incompleta de Socket.IO:**
  En la Sección 15.7 (líneas 874-880), se prueba Socket.IO mediante:
  ```javascript
  const socketPoll = await fetch('http://localhost:5000/socket.io/?EIO=4&transport=polling');
  const pollText = await socketPoll.text();
  assert(socketPoll.status === 200 && pollText.includes('sid'), 'Servidor Socket.IO responde exitosamente al handshake...');
  ```
  Esto únicamente comprueba la disponibilidad del endpoint HTTP de Engine.IO, pero no prueba conexiones WebSocket reales, autenticación por token en el apretón de manos, suscripción a salas por rol (`staff`, `admin`, `client_X`), ni recepción asíncrona de eventos.
- **Duplicidad:**
  La denegación de acceso a `/roles` para el Supervisor se evalúa dos veces: en la Sección 5 (`Supervisor intentando acceder a /roles responde 403 Forbidden`) y en la Sección 15.2 (`Supervisor bloqueado con 403 FORBIDDEN en /roles`).

### 2.2 Archivo: `testDirectMySQLPersistence.js` (457 líneas)
- **Calidad de implementación:** Excelente.
- **Mocks utilizados:** 0.
- **Verificación de persistencia:** Cada operación HTTP (`POST`, `PUT`, `DELETE`) va acompañada de una consulta SQL directa mediante `pool.query()` contra la base de datos `nexoeventos`, verificando la existencia o desaparición física de los registros.
- **Limpieza de datos:** Cuenta con un bloque previo preventivo y un bloque de limpieza final en estricto orden inverso de dependencias referenciales (agendas -> detalle_eventos -> eventos -> servicios -> usuarios -> clientes). No deja basura en la base de datos.

### 2.3 Archivo: `testCommercialWorkflow.js` (182 líneas)
- **Calidad de implementación:** Excelente.
- Valida el ciclo comercial completo: creación de evento en estado 'pendiente' -> aprobación y confirmación a cargo del supervisor -> verificación de visibilidad de agenda -> creación de actividad operativa -> asignación de responsables y equipo (`agenda_integrantes`) -> limpieza total de registros de prueba.

### 2.4 Archivo: `testBrowserE2E.js` (227 líneas)
- **Calidad de implementación:** Alta.
- Ejecuta Puppeteer en Chromium sin entorno simulado, interactuando con formularios reales, selectores CSS, modales de confirmación y verificando la ausencia total de pantallas negras y errores no controlados en la consola del navegador.

---

## 3. Auditoría Física de la Base de Datos MySQL 8.0

Se ejecutó un script de inspección directa sobre la instancia local de MySQL 8.0 sin alterar registros persistentes.

### 3.1 Estructura Tabular y Migraciones
Se comprobó la existencia de 11 tablas en la base de datos `nexoeventos`:
1. `agenda_integrantes`
2. `agenda_notas`
3. `agendas`
4. `categorias_agenda`
5. `clientes`
6. `detalle_eventos`
7. `eventos`
8. `roles`
9. `schema_migrations`
10. `servicios`
11. `usuarios`

La tabla `schema_migrations` contiene las 12 migraciones ejecutadas en orden cronológico:
- `001_create_roles.sql`
- `002_create_clientes.sql`
- `003_create_servicios.sql`
- `004_create_eventos.sql`
- `005_create_detalle_eventos.sql`
- `006_create_usuarios.sql`
- `007_seed_roles.sql`
- `008_seed_initial_data.sql`
- `009_create_calendar_tables.sql`
- `010_seed_calendar_categories.sql`
- `011_seed_initial_schedules.sql`
- `012_prevent_duplicate_event_schedules.sql`

### 3.2 Comprobación de la Restricción Funcional Única
Se verificó en los metadatos de MySQL el índice funcional `uq_evento_agenda_principal`:
- **Tabla:** `agendas`
- **Nombre de clave:** `uq_evento_agenda_principal`
- **No único:** `0` (Exige unicidad estricta)
- **Expresión evaluada:** `(case when ((id_categoria = 1) and (id_evento is not null)) then id_evento else NULL end)`
- **Tipo de índice:** `BTREE`

**Prueba en tiempo de ejecución:**
Se abrió una transacción controlada en la que se insertó una agenda principal (`id_categoria = 1`, `id_evento = 1`). Inmediatamente después, se intentó insertar una segunda agenda con los mismos parámetros.
- **Resultado:** MySQL interrumpió la operación arrojando el error `ER_DUP_ENTRY: Duplicate entry '1' for key 'agendas.uq_evento_agenda_principal'`.
- **Prueba de actividades secundarias:** Se insertaron dos registros para el mismo evento con categorías 2 (Meeting) y 3 (Setup and Rehearsal). Ambas fueron aceptadas sin colisión.
- **Cierre de prueba:** La transacción ejecutó `ROLLBACK`, preservando el estado original de la base de datos.

### 3.3 Integridad Referencial y Reglas de Protección
Se verificaron mediante transacciones abortadas las restricciones de clave foránea:
1. `clientes`: El borrado de un cliente con eventos (`id_cliente = 1`) fue rechazado con código `ER_ROW_IS_REFERENCED_2`.
2. `servicios`: El borrado de un servicio contratado en `detalle_eventos` fue rechazado con código `ER_ROW_IS_REFERENCED_2`.
3. `eventos`: El borrado de un evento con filas en `detalle_eventos` fue rechazado con código `ER_ROW_IS_REFERENCED_2`.
4. `agenda_integrantes` y `agenda_notas`: Poseen claves foráneas vinculadas a `agendas` con regla `ON DELETE CASCADE`.

---

## 4. Auditoría de Seguridad y Control de Acceso (RBAC)

Se implementó un script de prueba independiente (`audit_rbac.js`) que envió solicitudes HTTP directas con los tokens de sesión de cada rol.

### 4.1 Autenticación (401 Unauthorized)
- Solicitud sin cabecera `Authorization`: Devuelve 401.
- Solicitud con token sintácticamente inválido: Devuelve 401.
- Solicitud con token cuya firma criptográfica fue alterada intencionalmente: Devuelve 401 (`INVALID_TOKEN`).

### 4.2 Rol Supervisor
- `GET /api/usuarios`: Devuelve 403 Forbidden.
- `POST /api/usuarios`: Devuelve 403 Forbidden.
- `PUT /api/usuarios/1`: Devuelve 403 Forbidden.
- `DELETE /api/usuarios/1`: Devuelve 403 Forbidden.
- `GET /api/roles`: Devuelve 403 Forbidden.
- `PUT /api/roles/1`: Devuelve 403 Forbidden.
- `GET /api/eventos`: Devuelve 200 OK (Acceso permitido).
- `GET /api/schedules`: Devuelve 200 OK (Acceso permitido).

### 4.3 Rol Cliente y Aislamiento Multitenant
- `GET /api/usuarios`: Devuelve 403 Forbidden.
- `GET /api/roles`: Devuelve 403 Forbidden.
- `POST /api/servicios`: Devuelve 403 Forbidden.
- `GET /api/eventos/2` (Evento propiedad de otro cliente): Devuelve 403 Forbidden.
- `PUT /api/eventos/2`: Devuelve 403 Forbidden.
- `DELETE /api/eventos/2`: Devuelve 403 Forbidden.
- `GET /api/clientes/2`: Devuelve 403 Forbidden.
- `GET /api/eventos`: Retorna una lista donde el 100 % de los elementos poseen `id_cliente = 1`.

### 4.4 Inmutabilidad de la Base de Datos
Tras concluir la simulación de intentos de inserción y modificación no autorizados, se consultó MySQL directamente:
- Total de usuarios con correo `hacker@test.com`: 0.
- Nombre del Rol #1: permanece en `'administrador'`.
- Nombre del Evento #2: permanece intacto (`'Boda Real Carolina y Fernando'`).

---

## 5. Auditoría de Calendario y Socket.IO en Tiempo Real

Para solventar la omisión detectada en la suite previa, se implementó una prueba con **dos sesiones WebSocket simultáneas** (`audit_calendar_socket.js`).

### 5.1 Vistas y Configuración Regional
- **Vista Semanal (`GET /api/schedules/week`):** Devuelve una matriz de 7 días iniciando formalmente en Lunes.
- **Vista Diaria (`GET /api/schedules/day`):** Agrupa las actividades operativas de la jornada.
- **Resumen (`GET /api/schedules/summary`):** Retorna contadores agregados categorizados (`all`, `event`, `meeting`, `setupAndRehearsal`, `taskDeadlines`).
- **Zona Horaria:** Se verificó que tanto el endpoint `/api/health` como los bloques `VTIMEZONE` del exportador `.ics` especifican `America/Costa_Rica`.
- **Exportación iCalendar (`GET /api/schedules/export/ics`):** Genera una estructura conforme al RFC 5545, incluyendo identificadores únicos `UID` y marcas de tiempo `DTSTART` / `DTEND`.

### 5.2 Comunicación Bidireccional en Tiempo Real (2 Sesiones)
Se levantaron dos conexiones de `socket.io-client`:
- **Sesión A:** Autenticada con credenciales de Administrador (Sala: `admin`, `staff`).
- **Sesión B:** Autenticada con credenciales de Supervisor (Sala: `supervisor`, `staff`).

**Secuencia ejecutada:**
1. Sesión A emitió una petición REST `POST /api/schedules` creando una actividad operativa con ID #67.
   - **Resultado:** Sesión B recibió el evento `schedule:created` en 120 ms, conteniendo el título y detalles de la actividad sin recargar la página.
2. Sesión A emitió una petición REST `PATCH /api/schedules/67/reschedule` modificando las fechas (simulación de Drag & Drop).
   - **Resultado:** Sesión B recibió el evento `schedule:rescheduled` en tiempo real con el nuevo rango horario.
3. Sesión A emitió una petición REST `PATCH /api/schedules/67` modificando metadatos.
   - **Resultado:** Sesión B recibió el evento `schedule:updated` en tiempo real.
4. Sesión A emitió una petición REST `DELETE /api/schedules/67` para limpiar el registro de prueba.
   - **Resultado:** Sesión B recibió el evento `schedule:deleted` con `{ id_agenda: 67 }`. Ambas conexiones se cerraron limpiamente.

---

## 6. Auditoría de Interfaz y Navegador Real (Puppeteer)

Se ejecutó la suite automatizada de navegador `testBrowserE2E.js` sobre Google Chrome headless:

### 6.1 Administrador
- Acceso a `/login`, ingreso de credenciales válidas y redirección automática a `/dashboard`.
- El Dashboard renderiza las tarjetas de métricas operativas y comerciales sin errores de JavaScript.
- Se constató la **desaparición total del error `ShieldCheck is not defined`**. La aplicación cuenta con un `ErrorBoundary` que previene pantallas negras.
- En `/eventos`: apertura del modal de creación, llenado de campos con selectores relacionales, inserción exitosa reflejada en la tabla del DOM, edición de ubicación y eliminación asistida mediante el componente `ConfirmModal`.
- En `/calendario`: carga exitosa de la grilla de actividades.
- Cierre de sesión controlado con redirección a `/login`.

### 6.2 Supervisor
- Autenticación correcta y acceso a su vista de Dashboard.
- El encabezado refleja su ámbito de operaciones.
- Intento forzado de acceder a la ruta administrativa `/usuarios`: el sistema bloquea el acceso o redirige sin desestabilizar la aplicación ni emitir fallos no controlados.

### 6.3 Cliente
- Autenticación y navegación hacia el portal del cliente (`/portal-cliente`).
- Renderizado correcto de la sección de servicios contratados y catálogo disponible.
- Consola del navegador: **0 errores de JavaScript no controlados**.

---

## 7. Recomendaciones Técnicas y Plan de Acción

A pesar de que el código operativo de la aplicación cumple con las reglas funcionales y de seguridad, se recomienda aplicar las siguientes mejoras en los scripts de prueba:

1. **Limpieza en `testEndpoints.js`:**
   Agregar al final de la suite un bloque de limpieza que ejecute `DELETE /api/usuarios/:id` y `DELETE /api/clientes/:id` sobre el usuario creado en la Sección 3, para evitar que cada ejecución contamine la base de datos con registros huérfanos.
2. **Sustitución de la prueba de aislamiento en `testEndpoints.js`:**
   Reemplazar la prueba de la Sección 15.3 por una consulta auténtica a un recurso ajeno:
   ```javascript
   // Petición de Cliente 1 sobre Evento 2 (propiedad de Cliente 2)
   const alienEventRes = await request('/eventos/2', {
     headers: { Authorization: `Bearer ${clientToken}` }
   });
   assert(alienEventRes.status === 403, 'Cliente 1 bloqueado con 403 al intentar acceder a evento de Cliente 2');
   ```
3. **Depuración de registros huérfanos existentes en MySQL:**
   Ejecutar un script de mantenimiento para depurar los 16 usuarios de prueba acumulados previamente (`nuevo_cliente_...`).
4. **Incorporación permanente de la prueba de Socket.IO multi-cliente:**
   Integrar el script `audit_calendar_socket.js` dentro del comando `npm run test:socket` del backend para validar formalmente la comunicación en tiempo real en futuras revisiones.

---

## 8. Dictamen Final

El sistema **NexoEventos** se encuentra **FUNCIONAL, ESTABLE Y SEGURO**. La base de datos MySQL 8.0, las protecciones RBAC, la restricción de agenda principal única, el módulo de calendario y la sincronización en tiempo real cumplen con todos los requerimientos técnicos y académicos.

Las observaciones encontradas en esta auditoría independiente atañen exclusivamente a la metodología de los scripts de prueba de regresión y no representan vulnerabilidades activas ni fallas operativas en el software de producción.

Quedo a la espera de sus instrucciones y aprobación para proceder con la depuración de los registros huérfanos en la base de datos y el perfeccionamiento de los scripts de prueba señalados.

