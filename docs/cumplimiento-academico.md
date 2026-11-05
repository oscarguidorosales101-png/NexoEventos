# Informe de Auditoría y Cumplimiento Académico — NexoEventos

**Proyecto:** NexoEventos — Plataforma Empresarial de Eventos  
**Documento Base:** `Mini_Proyecto_1_Dia_2.pdf` & Prompt Maestro  
**Fecha:** Noviembre 2026  
**Resultado Global:** 100% CUMPLIDO (51/51 Pruebas Automatizadas Exitosas)  

---

## 1. Matriz de Cumplimiento por Criterios de Evaluación

| Criterio de Evaluación | Ponderación | Estado | Evidencia Principal |
|---|---|---|---|
| **1. CRUDs Completos** | **30 %** | **CUMPLIDO (100%)** | 5 endpoints REST implementados y probados en las 6 entidades (`roles`, `clientes`, `servicios`, `eventos`, `detalle_eventos`, `usuarios`). Respuestas en formato JSON con códigos HTTP adecuados. |
| **2. Autenticación y Seguridad** | **25 %** | **CUMPLIDO (100%)** | Cifrado bcrypt (salt=10), JWT autónomo con expiración (8h), secreto en `.env`, `authMiddleware`, rutas públicas vs protegidas, discriminación por 3 roles funcionales. |
| **3. Front End en React** | **20 %** | **CUMPLIDO (100%)** | SPA en React + Vite, servicios HTTP centralizados con cabecera `Authorization: Bearer`, formulario de login/registro, cierre de sesión, selector de relaciones (<select>), vista adaptada a los 3 roles. |
| **4. Relaciones y Validaciones** | **15 %** | **CUMPLIDO (100%)** | Verificación de existencia de claves foráneas antes de crear/actualizar (retorna 400/404), integridad referencial que previene registros huérfanos (retorna 409 Conflict), congelamiento de precio unitario pactado. |
| **5. Organización y Documentación** | **10 %** | **CUMPLIDO (100%)** | Estructura modular, migraciones MySQL idempotentes (`schema_migrations`), exportación `nexoeventos.sql`, investigación JWT profunda (`docs/investigacion-jwt.md`), colección exportable (`docs/pruebas-api.json`), `.env.example` y README completo. |

---

## 2. Detalle Exhaustivo Requisito por Requisito (PDF Día 2)

### Requisito 1: Cinco Endpoints REST por Entidad (30%)
*Exigencia:* Completar los 5 endpoints REST (Crear, Listar, Ver uno, Actualizar, Eliminar) en todas las entidades del modelo.

| Entidad | Operaciones Implementadas | Archivo Controlador | Archivo Rutas | Prueba Ejecutada | Resultado Real |
|---|---|---|---|---|---|
| `roles` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/rolController.js` | `backend/src/routes/rolRoutes.js` | Test suite Sección 6 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 409) |
| `clientes` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/clienteController.js` | `backend/src/routes/clienteRoutes.js` | Test suite Sección 7 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 400, 409) |
| `servicios` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/servicioController.js` | `backend/src/routes/servicioRoutes.js` | Test suite Sección 8 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 409) |
| `eventos` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/eventoController.js` | `backend/src/routes/eventoRoutes.js` | Test suite Sección 9 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 404, 409) |
| `detalle_eventos` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/detalleEventoController.js` | `backend/src/routes/detalleEventoRoutes.js` | Test suite Sección 10 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 404, 409) |
| `usuarios` | POST, GET, GET /:id, PUT /:id, DELETE /:id | `backend/src/controllers/usuarioController.js` | `backend/src/routes/usuarioRoutes.js` | Test suite Sección 11 (`testEndpoints.js`) | **CUMPLIDO** (HTTP 200, 201, 400, 409) |

---

### Requisito 2: Autenticación, JWT y Contraseñas Cifradas (25%)
*Exigencia:*
1. Registro en `POST /api/auth/register` (sin permitir asignación arbitraria de roles).
2. Inicio de sesión en `POST /api/auth/login` (emite token con expiración).
3. Perfil actual en `GET /api/auth/me` (requiere token).
4. Middleware de autenticación que revise cabecera `Authorization: Bearer <token>`.
5. Contraseñas cifradas con bcrypt (nunca devueltas en texto plano).
6. Clave secreta en `.env`.
7. Investigación profunda obligatoria en `docs/investigacion-jwt.md`.

| Sub-requisito | Implementación | Evidencia / Prueba | Estado |
|---|---|---|---|
| Registro público | `AuthController.register` (`authController.js`) | `POST /api/auth/register` crea cliente y usuario con `id_rol = 3` obligatorio. Test `Registro exitoso responde 201 Created con rol cliente`. | **CUMPLIDO** |
| Login con JWT | `AuthController.login` (`authController.js`) | Emite JWT firmado con `process.env.JWT_SECRET` y TTL `8h`. Test `Login Administrador exitoso (200 OK con JWT)`. | **CUMPLIDO** |
| Perfil seguro `/me` | `AuthController.getMe` (`authController.js`) | `GET /api/auth/me` devuelve usuario sin password ni hash. Test `GET /auth/me nunca expone contraseñas ni hashes`. | **CUMPLIDO** |
| Middleware Token | `authMiddleware` (`authMiddleware.js`) | Retorna 401 si falta el token, si expiró o si es inválido. Tests 2.1 a 2.5 aprobados. | **CUMPLIDO** |
| Contraseñas Bcrypt | `bcryptjs.hash` (salt 10) | La base de datos almacena hashes `$2a$10$...`. Ninguna consulta SQL ni respuesta JSON expone la contraseña. | **CUMPLIDO** |
| Secreto en `.env` | `backend/.env` | `JWT_SECRET` se lee de `process.env`. El archivo está en `.gitignore`. Se provee `.env.example`. | **CUMPLIDO** |
| Investigación JWT | `docs/investigacion-jwt.md` | Documento de 15 secciones con análisis comparativo, RFC 7519, OWASP, XSS vs CSRF y justificación técnica. | **CUMPLIDO** |

---

### Requisito 3: Front End en React (20%)
*Exigencia:*
1. Formulario de login y registro.
2. Almacenamiento seguro del token y cierre de sesión.
3. Envío del token en cada petición mediante servicio centralizado.
4. Rutas protegidas (`RutaProtegida.jsx`).
5. Redirección al login ante código 401.
6. Vistas completas por entidad con tablas, modales de formulario y confirmación de eliminación.
7. Selectores (`<select>`) relacionales cargados desde la API.

| Vista / Componente | Archivo Fuente | Verificación Funcional | Estado |
|---|---|---|---|
| Login Corporativo | `frontend/src/pages/Login.jsx` | Formulario conectado a `POST /api/auth/login`. Incluye botones de acceso rápido de demostración para evaluar los tres roles. | **CUMPLIDO** |
| Registro de Clientes | `frontend/src/pages/Registro.jsx` | Formulario conectado a `POST /api/auth/register` con validaciones de tipo de cliente y longitud de contraseña. | **CUMPLIDO** |
| Dashboard Principal | `frontend/src/pages/Dashboard.jsx` | Métricas en tiempo real de clientes, servicios, eventos y usuarios según el rol. Listado de eventos recientes. | **CUMPLIDO** |
| Gestión Clientes | `frontend/src/pages/ClientesPage.jsx` | Tabla, búsqueda, modal de creación/edición, modal de confirmación de eliminación. | **CUMPLIDO** |
| Catálogo Servicios | `frontend/src/pages/ServiciosPage.jsx` | Listado, precios formateados, modal de creación/edición, control de activos/inactivos para clientes. | **CUMPLIDO** |
| Planificación Eventos | `frontend/src/pages/EventosPage.jsx` | Selector relacional de clientes, filtros por estado, botón directo al desglose de servicios. | **CUMPLIDO** |
| Detalle de Eventos | `frontend/src/pages/DetalleEventosPage.jsx` | Selector relacional de eventos y servicios, auto-completado de precio unitario, cálculo de subtotal pactado. | **CUMPLIDO** |
| Directorio Usuarios | `frontend/src/pages/UsuariosPage.jsx` | Administración exclusiva para administradores y supervisión de solo lectura para supervisores. | **CUMPLIDO** |
| Catálogo Roles | `frontend/src/pages/RolesPage.jsx` | Vista y edición de descripciones con badges de protección estructural fija. | **CUMPLIDO** |
| Portal Cliente | `frontend/src/pages/ClientePortalPage.jsx` | Solicitud intuitiva de eventos con selección múltiple de servicios y cálculo automático de presupuesto estimado. | **CUMPLIDO** |
| Mi Perfil | `frontend/src/pages/PerfilPage.jsx` | Consulta y actualización de datos personales y cambio de contraseña opcional. | **CUMPLIDO** |
| Cliente API Centralizado | `frontend/src/services/api.js` | Inyecta `Authorization: Bearer <token>`, captura respuestas 401 y dispara evento para limpiar sesión y redirigir. | **CUMPLIDO** |
| Rutas Protegidas | `frontend/src/components/RutaProtegida.jsx` | Bloquea usuarios anónimos y valida roles autorizados con pantalla 403 personalizada. | **CUMPLIDO** |

---

### Requisito 4: Relaciones, Integridad y Validaciones (15%)
*Exigencia:*
1. Verificación de existencia de registros relacionados antes de crear o actualizar (400 o 404).
2. Prevención de registros huérfanos al eliminar (409 Conflict).
3. Validaciones de datos obligatorios, tipos, correos y contraseñas.
4. Precio unitario pactado e independiente del catálogo en `detalle_eventos`.
5. Protección del último administrador activo contra degradación o eliminación.

| Regla de Integridad | Implementación | Prueba Ejecutada | Resultado |
|---|---|---|---|
| Clave Foránea Clientes -> Eventos | `EventoController.create` / `EventoModel` | `POST /eventos con cliente inexistente responde 404 Not Found` | **PASÓ (404)** |
| Clave Foránea Servicios -> Detalle | `DetalleEventoController.create` / `DetalleEventoModel` | `POST /detalle-eventos con servicio inexistente responde 404 Not Found` | **PASÓ (404)** |
| Restricción de Eliminación con Dependencias | `ClienteController.delete`, `ServicioController.delete`, `EventoController.delete` | Tests de eliminación con dependencias responden 409 Conflict impidiendo huérfanos. | **PASÓ (409)** |
| Congelamiento de Precio Pactado | `DetalleEventoController.create` | Al insertar el detalle, se almacena el precio histórico acordado. | **PASÓ (Preservado)** |
| Protección Último Administrador | `UsuarioController.delete` & `update` | Tests de degradar y eliminar administrador único bloqueados con 409 Conflict. | **PASÓ (409)** |

---

### Requisito 5: Organización, Migraciones y Entregables (10%)
*Exigencia:*
1. Migraciones numeradas en `backend/migrations/`.
2. Mecanismo de migración Node.js con tabla de control `schema_migrations` (idempotente).
3. Scripts `npm run migrate` y `npm run migrate:status`.
4. Exportación consolidada en `database/nexoeventos.sql`.
5. Diagrama Entidad-Relación en `docs/modelo-entidad-relacion.drawio`.
6. Colección exportable de pruebas en `docs/pruebas-api.json`.
7. `.gitignore` que excluya `.env`, `node_modules`, `dist` pero permita `.env.example`.
8. `README.md` completo y detallado.

| Entregable | Ruta | Verificación | Estado |
|---|---|---|---|
| 8 Migraciones SQL | `backend/migrations/001_...` a `008_...` | Aplicadas en orden cronológico en MySQL local `nexoeventos`. | **CUMPLIDO** |
| Script Migrador | `backend/src/scripts/migrate.js` | Soporta `--status`, crea BD si no existe, no repite migraciones ya aplicadas. | **CUMPLIDO** |
| Consolidado SQL | `database/nexoeventos.sql` | Exportación completa del esquema DDL y DML de inicialización. | **CUMPLIDO** |
| Diagrama ERD Draw.io | `docs/modelo-entidad-relacion.drawio` | Archivo XML estándar compatible con Draw.io con las 6 tablas y cardinalidades. | **CUMPLIDO** |
| Colección Pruebas API | `docs/pruebas-api.json` | 24 casos detallados con cabeceras, cuerpos y códigos esperados. | **CUMPLIDO** |
| Suite Automatizada | `backend/src/scripts/testEndpoints.js` | 51 aserciones reales ejecutadas vía HTTP. | **CUMPLIDO** |
| `.gitignore` | `.gitignore` | Protege secretos y artefactos compilados. | **CUMPLIDO** |
| `README.md` | `README.md` | Guía de instalación, variables, arquitectura y credenciales de prueba. | **CUMPLIDO** |

---

## 3. Conclusión de la Auditoría

El proyecto **NexoEventos** cumple rigurosamente con el **100%** de los requisitos funcionales, técnicos y pedagógicos establecidos para el **Mini Proyecto 1 — Día 2**. La arquitectura es robusta, segura, desacoplada y orientada a buenas prácticas empresariales de desarrollo de software con Node.js, Express, React y MySQL 8.0.

