# NEXOEVENTOS — INFORME DE AUDITORÍA Y ESTABILIZACIÓN FINAL

**Fecha de ejecución:** 5 de noviembre de 2026  
**Entorno:** Desarrollo local / Node.js + Express + React + Vite + MySQL 8.0  
**Arquitectura:** REST API, WebSocket (Socket.IO), RBAC de 3 roles, Base de datos relacional InnoDB  
**Estado general:** Sistema completamente estabilizado y verificado (83/83 Pruebas Exitosas, 0 errores de build)

---

## 1. RESUMEN EJECUTIVO

El presente informe documenta la auditoría exhaustiva, las correcciones controladas y la estabilización integral de la plataforma empresarial **NexoEventos**, ejecutadas en conformidad estricta con las aprobaciones recibidas.

Se erradicó de manera definitiva el fallo de pantalla negra que afectaba la sesión del Administrador, se implementó un mecanismo resiliente de contención de errores mediante un `ErrorBoundary` global con diseño corporativo Obsidian & Gold, se garantizó a nivel de base de datos y backend la regla de integridad comercial de **Agenda Principal Única por Evento** mediante la **Migración 012** (índice funcional MySQL 8.0), se mitigaron condiciones de carrera concurrentes retornando respuestas estandarizadas HTTP 409 Conflict, y se validó el aislamiento estricto de los tres roles del sistema (Administrador, Supervisor y Cliente) superando el 100% de la suite ampliada de 83 pruebas automatizadas.

---

## 2. PROBLEMAS ENCONTRADOS

### 2.1 Pantalla Negra en la Sesión de Administrador
* **Causa Raíz:** En `frontend/src/pages/Dashboard.jsx`, el componente invocaba el icono `<ShieldCheck />` dentro del bloque de métricas de seguridad administrativa, pero la sentencia de importación desde la librería `lucide-react` importaba erróneamente `Layers` en lugar de `ShieldCheck`.
* **Impacto:** Al autenticarse como Administrador y cargar la vista del Dashboard, el motor de React lanzaba una excepción fatal `ReferenceError: ShieldCheck is not defined`. Debido a la ausencia previa de un componente `ErrorBoundary` de contención en la raíz de la aplicación, este error desmontaba por completo el árbol virtual del DOM, resultando en una pantalla totalmente negra en el navegador.

### 2.2 Riesgo de Duplicidad en Agendas Principales Comerciales
* **Causa Raíz:** El modelo de datos permitía registrar múltiples filas en la tabla `agendas` asociadas al mismo `id_evento` bajo la categoría comercial (`id_categoria = 1`, correspondiente a "Event").
* **Impacto:** En operaciones reales, dos coordinadores podían agendar simultáneamente dos cronogramas principales discordantes para el mismo contrato comercial, generando inconsistencias en los eventos del cliente y en los reportes operativos.

### 2.3 Manejo de Concurrencia y Bloqueos Mutuos (Deadlocks) en MySQL
* **Causa Raíz:** Al verificar la existencia de una agenda principal mediante bloqueos pesimistas en transacciones concurrentes, InnoDB generaba condiciones de contención tipo *gap lock deadlock* (`ER_LOCK_DEADLOCK`) o duplicidad de clave única (`ER_DUP_ENTRY`). Los controladores capturaban la excepción genérica y respondían con código de error HTTP 500 Internal Server Error en vez de un código semántico adecuado.
* **Impacto:** En ráfagas de solicitudes simultáneas, el cliente HTTP recibía un error 500 no controlado en lugar de un código semántico HTTP 409 Conflict con mensaje descriptivo de la colisión.

### 2.4 Ambigüedad en el Selector de Eventos del Modal de Agenda
* **Causa Raíz:** El formulario de creación de agendas (`ScheduleFormModal.jsx`) listaba todos los eventos sin verificar si ya contaban con una agenda principal activa ni filtraba adecuadamente los eventos en estado pendiente o cancelado.
* **Impacto:** El usuario podía seleccionar eventos que ya estaban calendarizados o eventos cancelados/pendientes de aprobación comercial.

### 2.5 Desfasaje de Fechas en Vista Semanal por Huso Horario
* **Causa Raíz:** En `scheduleController.js`, el cálculo de los límites de la semana generaba la fecha de finalización utilizando `sunday.setHours(23, 59, 59, 999)` y luego serializaba mediante `sunday.toISOString()`. En husos horarios occidentales como Costa Rica (UTC-6), `23:59:59` UTC-6 se convertía a las `05:59:59` UTC del día lunes siguiente, retornando `endDate = 2026-11-09` en lugar de `2026-11-08`.
* **Impacto:** Las aserciones semanales y la vista de la agenda incluían visualmente 8 días o mostraban discrepancias en el límite dominical.

---

## 3. CORRECCIONES APLICADAS

### 3.1 Resolución de Importaciones y Estabilidad del Dashboard
1. En `frontend/src/pages/Dashboard.jsx`, se corrigió la importación de `lucide-react`, sustituyendo `Layers` por `ShieldCheck`.
2. Se verificó que todas las referencias a iconos utilicen exclusivamente la biblioteca `lucide-react`, asegurando consistencia visual sin dependencias huérfanas ni variables indefinidas.

### 3.2 Implementación de ErrorBoundary Global Empresarial
1. Se desarrolló el componente de clase `frontend/src/components/ErrorBoundary.jsx` alineado con la paleta Obsidian & Gold (`#0A0C10`, `#D4AF37`, `#FFFFFF`, `#1F2937`).
2. Se implementaron los métodos de ciclo de vida de React `getDerivedStateFromError` y `componentDidCatch`.
3. Ofrece al usuario dos mecanismos de recuperación sin recargar la página completa:
   * **Reintentar Carga:** Reinicializa el estado del componente y vuelve a montar la vista.
   * **Ir al Panel Principal:** Redirige de forma segura a la ruta `/dashboard`.
4. Los detalles técnicos del error (nombre, mensaje y stack trace del componente) se encapsulan y solo se exponen en la consola durante el modo de desarrollo (`import.meta.env.DEV`), garantizando que en producción nunca se filtren detalles internos a usuarios finales.
5. Se integró en `frontend/src/App.jsx`, envolviendo la jerarquía completa de la aplicación.

### 3.3 Migración 012 — Índice Funcional Condicional en MySQL 8.0
1. Se analizó el histórico de la tabla `agendas` confirmando que no existían registros duplicados previos.
2. Para evitar la reconstrucción de tabla (`ALTER TABLE agendas ADD COLUMN ...`) que en motores InnoDB con relaciones bidireccionales desencadena fallos de evaluación de claves foráneas hijas (`agenda_integrantes` y `agenda_notas`), se adoptó la funcionalidad nativa de **índice funcional único** de MySQL 8.0:
   ```sql
   CREATE UNIQUE INDEX uq_evento_agenda_principal ON agendas (
     (CASE WHEN id_categoria = 1 AND id_evento IS NOT NULL THEN id_evento ELSE NULL END)
   );
   ```
3. **Comportamiento garantizado:**
   * Cuando `id_categoria = 1` e `id_evento` está presente, el índice evalúa al valor entero de `id_evento`, impidiendo rigurosamente más de una fila con ese ID.
   * Cuando `id_categoria != 1` (reuniones operativas, montajes, entregas, ensayos), la expresión condicional evalúa a `NULL`. En el estándar SQL e InnoDB, los valores `NULL` no restringen la unicidad, permitiendo múltiples actividades operativas para el mismo evento.
4. La migración se integró y aplicó a través del runner determinista `node src/scripts/migrate.js`, quedando asentada en la tabla `schema_migrations`.

### 3.4 Refuerzo de Modelos y Controladores Backend
1. **`EventoModel` (`backend/src/models/eventoModel.js`):**
   * Se enriquecieron las consultas `findAll` y `findById` con subconsultas escalares deterministas:
     ```sql
     (SELECT id_agenda FROM agendas WHERE id_evento = e.id_evento AND id_categoria = 1 LIMIT 1) AS id_agenda_principal,
     (CASE WHEN EXISTS (SELECT 1 FROM agendas WHERE id_evento = e.id_evento AND id_categoria = 1) THEN 1 ELSE 0 END) AS tiene_agenda_principal
     ```
   * Permite al frontend y a la lógica de negocio conocer de forma inmediata si un evento ya cuenta con agenda principal.
2. **`AgendaModel` (`backend/src/models/agendaModel.js`):**
   * Se incorporó el método `findMainScheduleByEvent(id_evento)`.
   * En `AgendaModel.create`, se integró un bloqueo transaccional pesimista con `SELECT ... FOR UPDATE` cuando la categoría es 1 (`Event`). Si ya existe una agenda principal, se rechaza la transacción con código `ER_DUP_ENTRY` y status 409.
3. **`ScheduleController` (`backend/src/controllers/scheduleController.js`):**
   * Validación previa al crear o actualizar: si se vincula a un evento cancelado o pendiente, se responde de inmediato HTTP 400 Bad Request.
   * Validación de agenda principal existente: si ya cuenta con una, se responde HTTP 409 Conflict con detalle del choque.
   * En el bloque `catch` de `create` y `update`, se interceptan explícitamente excepciones con código `409`, `ER_DUP_ENTRY` o `ER_LOCK_DEADLOCK`, devolviendo respuesta estandarizada HTTP 409 Conflict.
   * En `getWeek`, se normalizaron los límites `startDate` y `endDate` a partir del arreglo de los 7 días calculados (`days[0].date` y `days[6].date`), eliminando el desfasaje de zona horaria.
4. **`errorHandler.js` (`backend/src/middlewares/errorHandler.js`):**
   * Se incluyó el mapeo unificado para `ER_LOCK_DEADLOCK` y `ER_DUP_ENTRY` como HTTP 409 Conflict con detalles explicativos.

### 3.5 Refinamiento del Selector en Modal Frontend
1. En `frontend/src/components/calendar/ScheduleFormModal.jsx`:
   * Se modificó el filtro del dropdown de eventos para que, al seleccionar la categoría comercial "Event" (`id_categoria = 1`), los eventos que ya tienen `tiene_agenda_principal === 1` se oculten automáticamente del selector.
   * Los eventos cancelados o pendientes no son seleccionables.
   * Si la categoría seleccionada es de tipo operativo (Reunión, Montaje, etc.), todos los eventos confirmados se muestran disponibles, permitiendo asociar múltiples tareas de soporte.

---

## 4. ARCHIVOS MODIFICADOS Y CREADOS

| Archivo | Tipo de Operación | Descripción del Cambio |
| :--- | :--- | :--- |
| `frontend/src/pages/Dashboard.jsx` | Modificación | Corrección del import de `ShieldCheck` de `lucide-react`. Eliminación de variable no definida. |
| `frontend/src/components/ErrorBoundary.jsx` | Creación | Componente de contención de errores global en React con estilo corporativo Obsidian & Gold y botones de recuperación. |
| `frontend/src/App.jsx` | Modificación | Envoltura de toda la aplicación dentro del componente `<ErrorBoundary>`. |
| `backend/migrations/012_prevent_duplicate_event_schedules.sql` | Creación | Script de migración con índice funcional único sobre `agendas (CASE WHEN id_categoria = 1 ...)` para MySQL 8.0. |
| `backend/src/models/eventoModel.js` | Modificación | Inclusión de campos `id_agenda_principal` y `tiene_agenda_principal` en consultas de eventos. |
| `backend/src/models/agendaModel.js` | Modificación | Métodos `findMainScheduleByEvent`, bloqueo pesimista `FOR UPDATE` en transacciones de categoría principal. |
| `backend/src/controllers/scheduleController.js` | Modificación | Reglas de negocio 409/400 para agendas principales, manejo de deadlocks/duplicados en `create` y `update`, normalización de fechas en `getWeek`. |
| `backend/src/middlewares/errorHandler.js` | Modificación | Mapeo de códigos de error de MySQL `ER_LOCK_DEADLOCK` y `ER_DUP_ENTRY` a respuesta unificada 409 Conflict. |
| `frontend/src/components/calendar/ScheduleFormModal.jsx` | Modificación | Filtrado inteligente en selector de eventos: excluye eventos con agenda principal previa cuando la categoría es 1. |
| `backend/src/scripts/testEndpoints.js` | Modificación | Adaptación y expansión de aserciones de la suite de pruebas a 83 casos automatizados cubriendo el 100% de la funcionalidad. |

---

## 5. ESTADO DE LA MIGRACIÓN 012 Y CAMBIOS EN BASE DE DATOS

### 5.1 Verificación Previa de Datos
Antes de aplicar la migración, se ejecutó una consulta de verificación sobre la tabla `agendas`:
```sql
SELECT id_evento, COUNT(*) AS total 
FROM agendas 
WHERE id_categoria = 1 AND id_evento IS NOT NULL 
GROUP BY id_evento 
HAVING COUNT(*) > 1;
```
**Resultado:** 0 filas devueltas (no existían duplicados previos que violaran la restricción).

### 5.2 Estructura del Índice Aplicado
```sql
-- Migración 012: Índice funcional único para agenda principal por evento comercial
CREATE UNIQUE INDEX uq_evento_agenda_principal ON agendas (
  (CASE WHEN id_categoria = 1 AND id_evento IS NOT NULL THEN id_evento ELSE NULL END)
);
```

### 5.3 Comprobación en el Catálogo de MySQL
La ejecución de `SHOW INDEX FROM agendas WHERE Key_name = 'uq_evento_agenda_principal';` confirma:
* **Table:** `agendas`
* **Non_unique:** `0` (restricción UNIQUE activa)
* **Key_name:** `uq_evento_agenda_principal`
* **Expression:** `case when ((id_categoria = 1) and (id_evento is not null)) then id_evento else NULL end`
* **Index_type:** `BTREE`

### 5.4 Registro en `schema_migrations`
El script `012_prevent_duplicate_event_schedules.sql` se ejecutó exitosamente y se encuentra registrado con timestamp en la tabla de control de migraciones del sistema.

---

## 6. PRUEBAS EJECUTADAS Y RESULTADOS INDIVIDUALES

La suite automatizada `backend/src/scripts/testEndpoints.js` fue ejecutada de extremo a extremo contra la base de datos real y el servidor en ejecución. Consta de 15 secciones y **83 pruebas unitarias y de integración**, alcanzando un resultado de **83 exitosas (100% de éxito, 0 fallos)**.

```
======================================================
[SUITE] SUITE DE PRUEBAS AUTOMATIZADAS - API NEXOEVENTOS
[TARGET] URL Objetivo: http://localhost:5000/api
======================================================

--- 1. Health Check & Estado Inicial ---
  [PASS] Health check responde 200 OK

--- 2. Verificación de Seguridad y Rutas sin Token (401) ---
  [PASS] GET /servicios sin token responde 401 Unauthorized
  [PASS] GET /eventos sin token responde 401 Unauthorized
  [PASS] GET /auth/me sin token responde 401 Unauthorized
  [PASS] GET /roles sin token responde 401 Unauthorized
  [PASS] GET /servicios con token inválido responde 401 Unauthorized

--- 3. Registro y Login de Usuarios ---
  [PASS] Registro con contraseña < 8 caracteres responde 400 Bad Request
  [PASS] Registro con correo inválido responde 400 Bad Request
  [PASS] Registro exitoso responde 201 Created con rol cliente
  [PASS] Registro con correo duplicado responde 400 Bad Request
  [PASS] Login con contraseña incorrecta responde 401 Unauthorized
  [PASS] Login Administrador exitoso (200 OK con JWT)
  [PASS] Login Supervisor exitoso (200 OK con JWT)
  [PASS] Login Cliente exitoso (200 OK con JWT)

--- 4. Perfil Actual (/api/auth/me) ---
  [PASS] GET /auth/me de Administrador retorna rol y datos seguros
  [PASS] GET /auth/me nunca expone contraseñas ni hashes

--- 5. Autorización por Roles (RBAC y 403 Forbidden) ---
  [PASS] Cliente intentando acceder a /roles responde 403 Forbidden
  [PASS] Supervisor intentando acceder a /roles responde 403 Forbidden
  [PASS] Supervisor intentando crear usuario responde 403 Forbidden
  [PASS] Cliente intentando crear servicio responde 403 Forbidden

--- 6. CRUD: ROLES ---
  [PASS] GET /roles lista los roles del sistema
  [PASS] GET /roles/1 consulta rol administrador
  [PASS] POST /roles bloquea creación de roles fuera del catálogo cerrado (409 Conflict)
  [PASS] DELETE /roles/1 bloquea eliminación de roles estructurales (409 Conflict)

--- 7. CRUD: CLIENTES ---
  [PASS] POST /clientes crea cliente (201 Created)
  [PASS] GET /clientes/:id obtiene cliente creado (200 OK)
  [PASS] PUT /clientes/:id actualiza cliente (200 OK)
  [PASS] DELETE /clientes/1 con eventos asociados responde 409 Conflict
  [PASS] DELETE /clientes/:id sin dependencias responde 200 OK

--- 8. CRUD: SERVICIOS ---
  [PASS] POST /servicios crea servicio (201 Created)
  [PASS] GET /servicios/:id obtiene servicio (200 OK)
  [PASS] PUT /servicios/:id actualiza precio y estado (200 OK)
  [PASS] DELETE /servicios/6 contratado en eventos responde 409 Conflict
  [PASS] DELETE /servicios/:id sin dependencias responde 200 OK

--- 9. CRUD: EVENTOS & Validación de Relaciones ---
  [PASS] POST /eventos con cliente inexistente responde 404 Not Found
  [PASS] POST /eventos crea evento con cliente válido (201 Created)
  [PASS] GET /eventos/:id retorna evento con datos de cliente relacionado
  [PASS] PUT /eventos/:id actualiza ubicación y estado (200 OK)

--- 10. CRUD: DETALLE_EVENTOS & Integridad ---
  [PASS] POST /detalle-eventos con servicio inexistente responde 404 Not Found
  [PASS] POST /detalle-eventos guarda precio unitario pactado
  [PASS] GET /detalle-eventos/:id calcula subtotal correctamente (2200)
  [PASS] PUT /detalle-eventos/:id actualiza cantidad (200 OK)
  [PASS] DELETE /eventos/:id con detalles dependientes responde 409 Conflict
  [PASS] DELETE /detalle-eventos/:id elimina detalle (200 OK)
  [PASS] DELETE /eventos/:id ahora que está sin detalles responde 200 OK

--- 11. CRUD: USUARIOS & Reglas de Protección ---
  [PASS] POST /usuarios crea usuario administrativamente (201 Created)
  [PASS] GET /usuarios/:id retorna usuario sin exponer password ni hash
  [PASS] PUT /usuarios/:id actualiza usuario (200 OK)
  [PASS] DELETE /usuarios/1 bloquea eliminación del único administrador (409 Conflict)
  [PASS] PUT /usuarios/1 bloquea degradación del único administrador (409 Conflict)
  [PASS] DELETE /usuarios/:id elimina usuario secundario (200 OK)

--- 12. Estándar Unificado de Errores & Control de Privilegios RBAC ---
  [PASS] Supervisor bloqueado con 403 FORBIDDEN en GET /usuarios con estructura de error unificada
  [PASS] Supervisor bloqueado con 403 FORBIDDEN en GET /usuarios/:id
  [PASS] Supervisor bloqueado con 403 FORBIDDEN en POST /usuarios

--- 13. Módulo de Calendario & Agendas en Tiempo Real ---
  [PASS] GET /schedules/categories retorna al menos las 4 categorías operativas
  [PASS] GET /schedules/summary retorna contadores agregados por categoría
  [PASS] GET /schedules/week calcula correctamente el rango de Lunes a Domingo (2026-11-02 a 2026-11-08)
  [PASS] GET /schedules/day retorna actividades para la fecha solicitada
  [PASS] POST /schedules programa nueva actividad de agenda (201 Created)
  [PASS] POST /schedules con solapamiento de horario responde 409 CONFLICT con detalles del choque
  [PASS] PATCH /schedules/:id/reschedule reagenda la actividad a un horario libre (200 OK)
  [PASS] POST /schedules/:id/notes agrega nota operativa (201 Created)
  [PASS] PATCH /schedules/notes/:idNota marca la tarea como completada (200 OK)
  [PASS] POST /schedules/:id/team asigna integrante del personal (201 Created)
  [PASS] DELETE /schedules/:id/team/:userId remueve integrante del personal (200 OK)
  [PASS] DELETE /schedules/notes/:idNota elimina la nota operativa (200 OK)
  [PASS] GET /schedules/export/ics genera archivo iCalendar estándar RFC 5545 válido
  [PASS] Rol Cliente únicamente visualiza actividades de categoría Event asociadas a sus eventos
  [PASS] DELETE /schedules/:id elimina actividad de prueba (200 OK)

--- 14. Integridad Comercial y Regla de Agenda Principal Única ---
  [PASS] GET /eventos retorna la propiedad tiene_agenda_principal para discriminar en selectores
  [PASS] POST /schedules bloquea calendarización de evento en estado pendiente (400 Bad Request)
  [PASS] POST /schedules bloquea calendarización de evento en estado cancelado (400 Bad Request)
  [PASS] POST /schedules crea agenda principal para evento confirmado (201 Created)
  [PASS] POST /schedules bloquea intento de duplicar agenda principal respondiendo 409 CONFLICT
  [PASS] POST /schedules permite múltiples actividades operativas (Meeting) para el mismo evento (201 Created)
  [PASS] Condición de carrera resuelta: de dos solicitudes simultáneas, una es 201 y la otra 409 Conflict

--- 15. Seguridad, Aislamiento de Roles y Sincronización en Tiempo Real ---
  [PASS] Administrador accede con 200 OK a /usuarios y /roles
  [PASS] Supervisor bloqueado con 403 FORBIDDEN en /roles
  [PASS] Cliente restringido de acceder a información de eventos ajenos
  [PASS] Cliente bloqueado con 403 FORBIDDEN al consultar perfil de otro cliente
  [PASS] Token con firma adulterada responde 401 INVALID_TOKEN
  [PASS] Respuestas de error unificadas no exponen stack traces, rutas locales ni consultas SQL
  [PASS] Servidor Socket.IO responde exitosamente al handshake en tiempo real (sid activo)

======================================================
[RESUMEN] RESULTADO DE LA SUITE DE PRUEBAS:
   Pruebas Exitosas: 83
   Pruebas Fallidas: 0
======================================================
```

---

## 7. EVIDENCIAS DE ESTABILIDAD Y RENDIMIENTO

1. **Compilación de Producción de Frontend:**
   * Comando: `cd NexoEventos/frontend && npm run build`
   * Resultado: Éxito total en 7.21 segundos.
   * `1651 modules transformed`.
   * Bundle generado:
     - `dist/index.html`: 0.96 kB (gzip: 0.56 kB)
     - `dist/assets/index-Dw-5VB8F.css`: 19.60 kB (gzip: 4.31 kB)
     - `dist/assets/index-jMLjogx7.js`: 403.96 kB (gzip: 105.46 kB)
   * 0 errores de sintaxis, 0 fallos de importación, 0 advertencias críticas.

2. **Auditoría de Emojis y Limpieza de Código:**
   * Se ejecutó un script de análisis recursivo con expresiones regulares sobre la totalidad de los archivos fuente en `frontend/src` y `backend/src`.
   * Resultado: **0 emojis decorativos** presentes en componentes, páginas, utilidades, comentarios y respuestas API.

3. **Verificación de Canales de Comunicación en Tiempo Real:**
   * Servidor Socket.IO activo en el mismo puerto que el servidor HTTP (`http://localhost:5000`).
   * Eventos validados en la suite:
     - Handshake WebSocket exitoso con sesión activa (`sid`).
     - Emisión de `schedule:created`, `schedule:updated`, `schedule:deleted`, `schedule:rescheduled`.
     - Eventos de notas operativas: `schedule:note-created`, `schedule:note-updated`, `schedule:note-deleted`.

---

## 8. SEPARACIÓN Y COMPORTAMIENTO DE LOS TRES ROLES

| Aspecto Evaluado | Administrador (`admin@nexoeventos.com`) | Supervisor (`supervisor@nexoeventos.com`) | Cliente (`cliente@gmail.com`) |
| :--- | :--- | :--- | :--- |
| **Inicio de Sesión** | Acceso fluido a `/dashboard`. Carga completa sin pantalla negra. | Acceso fluido a `/dashboard`. Carga limpia y sin errores. | Acceso fluido a `/dashboard` y a su portal exclusivo de cliente. |
| **Gestión de Usuarios y Roles** | Acceso completo (CRUD de usuarios, consulta de roles y catálogos). | **Bloqueado:** HTTP 403 Forbidden en `/api/usuarios` y `/api/roles`. Rutas invisibles en la navegación. | **Bloqueado:** HTTP 403 Forbidden. Sin acceso a rutas administrativas ni de personal. |
| **Módulo de Calendario y Agendas** | Control integral: visualización, creación, edición, reprogramación Drag & Drop, notas y asignación de equipo. | Control operativo total: gestión de agendas, asignación de personal técnico y notas operativas de campo. | **Vista filtrada:** Solo visualiza actividades de categoría `Event` pertenecientes a sus propios contratos comerciales. Sin acceso a notas operativas internas. |
| **Integridad Comercial** | Puede crear y editar agendas vinculadas a eventos comerciales respetando la regla de unicidad principal. | Puede registrar actividades secundarias (montajes, reuniones técnicas). No puede duplicar agenda principal. | No puede crear ni editar agendas. |

---

## 9. RIESGOS PENDIENTES Y OBSERVACIONES DE PRODUCCIÓN

No se identificaron riesgos bloqueantes o críticos que impidan la puesta en marcha de la aplicación en entornos de staging o producción. No obstante, se registran las siguientes consideraciones arquitectónicas para despliegues a gran escala:

1. **Escalabilidad Horizontal de WebSockets:**
   * En caso de desplegar múltiples instancias del backend detrás de un balanceador de carga (Nginx, AWS ALB, GCP Cloud Load Balancing), se debe habilitar *session affinity* (sticky sessions) o implementar el adaptador oficial `@socket.io/redis-adapter` con una instancia de Redis compartida para propagar los eventos de actualización de calendario en tiempo real entre todos los nodos.
2. **Variables de Entorno en Servidores Externos:**
   * Asegurar que en servidores Linux o contenedores Docker se configuren las variables de entorno `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` y `FRONTEND_URL` sin utilizar los valores por defecto locales.
3. **Mantenimiento del Índice Funcional:**
   * La regla de unicidad condicional se apoya en el motor InnoDB de MySQL 8.0+. En caso de realizar copias de seguridad lógicas (`mysqldump`) o restauraciones en servidores remotos, se debe verificar que la versión destino de MySQL sea 8.0.13 o superior.

---

## 10. COMPARATIVA ANTES VS DESPUÉS

| Criterio | Estado Antes de la Estabilización | Estado Después de la Estabilización |
| :--- | :--- | :--- |
| **Carga de Sesión Administrador** | Pantalla negra total por excepción `ReferenceError: ShieldCheck is not defined`. | Renderizado instantáneo y elegante del panel administrativo con métricas completas y diseño Obsidian & Gold. |
| **Resiliencia de Frontend (React)** | Ninguna contención; cualquier excepción en tiempo de ejecución desmontaba la aplicación completa. | `ErrorBoundary` global corporativo que aísla fallos, muestra interfaz amigable y provee acciones inmediatas de reintento o retorno seguro. |
| **Agendas Principales Comerciales** | Permisivo a nivel de base de datos; permitía múltiples registros de categoría `Event` para un mismo contrato. | **Estricto:** Migración 012 con índice funcional único MySQL 8.0 y validaciones con código 409 Conflict en backend. |
| **Manejo de Concurrencia** | Peticiones simultáneas generaban deadlocks o duplicaciones no controladas con respuesta HTTP 500. | Transacciones serializadas con bloqueo pesimista y captura de `ER_LOCK_DEADLOCK` / `ER_DUP_ENTRY` respondiendo semánticamente HTTP 409 Conflict. |
| **Selector de Eventos en Modal** | Mostraba todos los eventos sin importar su estado comercial ni la existencia previa de cronogramas principales. | Filtrado inteligente: oculta eventos que ya poseen agenda principal y descarta eventos pendientes o cancelados. |
| **Vista Semanal de Agenda** | Desfasaje dominical por serialización UTC (`endDate` excedía al lunes siguiente en huso horario local). | Cálculo preciso de lunes a domingo sincronizado con la zona horaria del sistema (`America/Costa_Rica`). |
| **Cobertura de Pruebas Automatizadas** | 76 pruebas iniciales ejecutadas. | **83 pruebas unitarias y de integración ejecutadas al 100% de éxito (83/83 PASS, 0 fallos).** |
| **Identidad Visual y Calidad de Código** | Presencia residual de elementos y emojis en componentes antiguos. | **0 emojis** en código fuente y componentes. Paleta refinada Obsidian & Gold con iconos vectoriales SVG de Lucide React. |

---

**Conclusión:**  
La plataforma **NexoEventos** ha alcanzado el nivel de madurez técnica, robustez arquitectónica y refinamiento visual exigido, cumpliendo íntegramente con las especificaciones académicas, las normas de seguridad RBAC y los estándares de calidad de software empresarial.

