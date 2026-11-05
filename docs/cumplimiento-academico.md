# Informe de Auditoría y Cumplimiento Académico — NexoEventos

**Proyecto:** NexoEventos — Plataforma Empresarial de Eventos & Calendario en Tiempo Real  
**Documento Base:** `Mini_Proyecto_1_Dia_2.pdf` & Prompt Maestro de Auditoría, Seguridad RBAC y Calendario  
**Fecha:** Noviembre 2026  
**Resultado Global:** 100% CUMPLIDO (69/69 Pruebas Automatizadas Exitosas)  

---

## 1. Matriz de Cumplimiento por Criterios de Evaluación

| Criterio de Evaluación | Ponderación | Estado | Evidencia Principal |
|---|---|---|---|
| **1. CRUDs Completos** | **30 %** | **CUMPLIDO (100%)** | 5 endpoints REST implementados y probados en las 6 entidades base (`roles`, `clientes`, `servicios`, `eventos`, `detalle_eventos`, `usuarios`) más el módulo de `agendas`. Respuestas en formato JSON con estándar de error unificado. |
| **2. Autenticación y Seguridad** | **25 %** | **CUMPLIDO (100%)** | Cifrado bcrypt (salt=10), JWT autónomo con expiración (8h), secreto en `.env`, `authMiddleware`, rutas públicas vs protegidas, discriminación por 3 roles funcionales con aislamiento estricto de Supervisor (403 en `/usuarios`). |
| **3. Front End en React** | **20 %** | **CUMPLIDO (100%)** | SPA en React + Vite, servicios HTTP centralizados con cabecera `Authorization: Bearer`, formulario de login/registro, cierre de sesión, selector de relaciones (<select>), vista adaptada a los 3 roles y módulo de Calendario interactivo con Socket.IO. |
| **4. Relaciones y Validaciones** | **15 %** | **CUMPLIDO (100%)** | Verificación de existencia de claves foráneas antes de crear/actualizar (retorna 400/404), integridad referencial que previene registros huérfanos (retorna 409 Conflict), congelamiento de precio unitario pactado y algoritmo de detección de conflictos de intervalo en agendas. |
| **5. Organización y Documentación** | **10 %** | **CUMPLIDO (100%)** | Estructura modular, 11 migraciones MySQL idempotentes (`schema_migrations`), exportación `nexoeventos.sql`, investigación JWT profunda (`docs/investigacion-jwt.md`), colección exportable (`docs/pruebas-api.json`), `.env.example` y README completo. |

---

## 2. Detalle Exhaustivo Requisito por Requisito

### Requisito 1: Cinco Endpoints REST por Entidad (30%)

| Entidad | Operaciones Implementadas | Archivo Controlador | Archivo Rutas | Prueba Ejecutada | Resultado Real |
|---|---|---|---|---|---|
| `roles` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/rolController.js` | `backend/src/routes/rolRoutes.js` | Test suite Sección 6 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 409) |
| `clientes` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/clienteController.js` | `backend/src/routes/clienteRoutes.js` | Test suite Sección 7 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 400, 409) |
| `servicios` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/servicioController.js` | `backend/src/routes/servicioRoutes.js` | Test suite Sección 8 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 409) |
| `eventos` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/eventoController.js` | `backend/src/routes/eventoRoutes.js` | Test suite Sección 9 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 404, 409) |
| `detalle_eventos` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/detalleEventoController.js` | `backend/src/routes/detalleEventoRoutes.js` | Test suite Sección 10 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 404, 409) |
| `usuarios` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/usuarioController.js` | `backend/src/routes/usuarioRoutes.js` | Test suite Sección 11 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 400, 409) |
| `agendas` | POST, GET, GET /:id, PUT /:id, DELETE /:id, PATCH /reschedule | `backend/src/controllers/scheduleController.js` | `backend/src/routes/scheduleRoutes.js` | Test suite Sección 13 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 409) |

---

### Requisito 2: Autenticación, Seguridad y RBAC Estricto (25%)

| Sub-requisito | Implementación | Evidencia / Prueba | Estado |
|---|---|---|---|
| Registro público | `AuthController.register` | Crea cliente y usuario con `id_rol = 3` obligatorio. Rechaza contraseñas < 8 caracteres y correos duplicados. | **CUMPLIDO** |
| Login con JWT | `AuthController.login` | Emite JWT firmado con `process.env.JWT_SECRET` y TTL `8h`. Handshake en Socket.IO autenticado con JWT. | **CUMPLIDO** |
| Perfil seguro `/me` | `AuthController.getMe` | Devuelve usuario sin password ni hash. Nunca expone contraseñas. | **CUMPLIDO** |
| Middleware Token | `authMiddleware` | Retorna 401 si falta el token, si expiró o si es inválido. Estándar unificado de error. | **CUMPLIDO** |
| Contraseñas Bcrypt | `bcryptjs.hash` (salt 10) | La base de datos almacena hashes `$2a$10$...`. Ninguna consulta expone la contraseña. | **CUMPLIDO** |
| Bloqueo a Supervisor | `requireAdmin` en `usuarioRoutes.js` | El supervisor no puede listar ni crear usuarios. Retorna 403 Forbidden con error unificado. | **CUMPLIDO** |
| Front Bloqueado | `RutaProtegida.jsx` con `allowedRoles={['administrador']}` | Redirección con pantalla de 403 Acceso Denegado si un supervisor digita `/usuarios` o `/roles`. | **CUMPLIDO** |

---

### Requisito 3: Front End en React con Módulo de Calendario (20%)

| Vista / Componente | Archivo Fuente | Verificación Funcional | Estado |
|---|---|---|---|
| Login Corporativo | `frontend/src/pages/Login.jsx` | Conectado a `POST /api/auth/login`. Botones de auto-llenado para los 3 roles. | **CUMPLIDO** |
| Registro de Clientes | `frontend/src/pages/Registro.jsx` | Conectado a `POST /api/auth/register` con validaciones institucionales. | **CUMPLIDO** |
| Dashboard Principal | `frontend/src/pages/Dashboard.jsx` | Métricas en tiempo real según el rol. Listado de eventos recientes. | **CUMPLIDO** |
| Módulo de Calendario | `frontend/src/pages/CalendarioPage.jsx` | Vistas Semanal (Lunes a Domingo), Mensual y Diaria con Socket.IO en tiempo real. | **CUMPLIDO** |
| Tarjetas de Resumen | `frontend/src/components/calendar/SummaryCards.jsx` | 5 tarjetas de contadores y filtro interactivo por categoría. | **CUMPLIDO** |
| Vista Semanal | `frontend/src/components/calendar/WeeklyView.jsx` | 7 columnas (Lunes a Domingo), 08:00 AM - 08:00 PM, Drag & Drop funcional con detección de 409. | **CUMPLIDO** |
| Drawer de Detalle | `frontend/src/components/calendar/ScheduleDetailDrawer.jsx` | Panel lateral derecho con detalle, equipo operativo, checklist interactivo y exportación .ics. | **CUMPLIDO** |
| Modal de Agenda | `frontend/src/components/calendar/ScheduleFormModal.jsx` | Creación y edición con selector de categorías, PIC, equipo y banner de choque de horario. | **CUMPLIDO** |
| Toast de Notificaciones| `frontend/src/components/Toast.jsx` | Alertas dinámicas no intrusivas en pantalla para eventos Socket.IO y operaciones REST. | **CUMPLIDO** |

---

### Requisito 4: Relaciones, Integridad y Detección de Conflictos (15%)

| Regla de Integridad | Implementación | Prueba Ejecutada | Resultado |
|---|---|---|---|
| Clave Foránea Clientes -> Eventos | `EventoController.create` / `EventoModel` | `POST /eventos con cliente inexistente responde 404 Not Found` | **PASÓ (404)** |
| Clave Foránea Servicios -> Detalle | `DetalleEventoController.create` / `DetalleEventoModel` | `POST /detalle-eventos con servicio inexistente responde 404 Not Found` | **PASÓ (404)** |
| Restricción de Eliminación | `ClienteController.delete`, `ServicioController.delete`, `EventoController.delete` | Eliminaciones con dependencias activas responden 409 Conflict impidiendo huérfanos. | **PASÓ (409)** |
| Precio Unitario Congelado | `DetalleEventoController.create` | Al insertar el detalle, se almacena el precio histórico pactado independiente del catálogo. | **PASÓ (Preservado)** |
| Protección Último Admin | `UsuarioController.delete` & `update` | Intentos de degradar o eliminar al único administrador bloqueados con 409 Conflict. | **PASÓ (409)** |
| Detección de Conflicto de Horario | `AgendaModel.checkConflict` | `(inicioA < finB AND finA > inicioB)` para PIC o equipo responde 409 CONFLICT con detalles. | **PASÓ (409)** |

---

### Requisito 5: Organización, Migraciones y Entregables (10%)

| Entregable | Ruta | Verificación | Estado |
|---|---|---|---|
| 11 Migraciones SQL | `backend/migrations/001_...` a `011_...` | Ejecutadas y verificadas en `schema_migrations` de MySQL local `nexoeventos`. | **CUMPLIDO** |
| Script Migrador | `backend/src/scripts/migrate.js` | Soporta `--status`, crea BD si no existe, idempotentemente aplica pendientes. | **CUMPLIDO** |
| Consolidado SQL | `database/nexoeventos.sql` | Exportación completa del esquema DDL y DML de las 10 tablas. | **CUMPLIDO** |
| Diagrama ERD Draw.io | `docs/modelo-entidad-relacion.drawio` | Diagrama estándar Draw.io con las 10 tablas y sus relaciones. | **CUMPLIDO** |
| Colección Pruebas API | `docs/pruebas-api.json` | 36 casos de prueba completos exportables para Postman / Thunder Client. | **CUMPLIDO** |
| Suite Automatizada | `backend/src/scripts/testEndpoints.js` | 69 aserciones reales HTTP con salida detallada. | **69/69 PASÓ (100%)** |
| Informe de Auditoría | `docs/auditoria-integral-final.md` | Diagnóstico, causas de fallos, correcciones y arquitectura. | **CUMPLIDO** |
| README.md | `README.md` | Guía de instalación, variables, arquitectura y credenciales de prueba. | **CUMPLIDO** |
