# NexoEventos — Plataforma Empresarial de Gestión de Eventos & Calendario en Tiempo Real

> **Auditoría Integral, Seguridad RBAC Estricta y Módulo de Calendario en Tiempo Real**  
> Sistema corporativo para empresas de planificación de eventos de alta gama, desarrollado con arquitectura desacoplada: API REST y Socket.IO en **Node.js + Express**, base de datos relacional en **MySQL 8.0** y cliente web interactivo en **React + Vite**.

---

## 1. Propósito del Sistema

**NexoEventos** es una plataforma corporativa privada diseñada para planificar, coordinar y cotizar eventos sociales y empresariales de lujo (bodas, convenciones, galas, aniversarios y lanzamientos corporativos).

El sistema integra dos núcleos principales:
1. **Núcleo de Gestión Comercial y Administrativa:**
   - Registro y segmentación de clientes (personas naturales y corporativas).
   - Catálogo de servicios profesionales (decoración, catering, fotografía, sonido, iluminación y producción).
   - Planificación de eventos con ciclo de vida controlado (*pendiente*, *confirmado*, *completado*, *cancelado*).
   - Desglose detallado de servicios con congelación de precio histórico pactado.
   - Seguridad mediante JWT y tres roles funcionales: **administrador**, **supervisor** y **cliente**.
2. **Módulo de Calendario & Agendas en Tiempo Real:**
   - Vistas interactivas: **Semanal** (estricta de Lunes a Domingo, 08:00 AM - 08:00 PM), **Mensual** y **Diaria**.
   - Sincronización bidireccional instantánea mediante **Socket.IO** (actualizaciones en vivo sin recargar).
   - Reagendamiento inteligente por **Drag & Drop** con detección algorítmica de conflictos de horario (HTTP 409).
   - Asignación de responsables principales (PIC) y equipos operativos auxiliares.
   - Checklist y notas operativas interactivas con estados de completitud en tiempo real.
   - Exportación de agendas al estándar internacional **RFC 5545 iCalendar (.ics)**.
   - Zona horaria corporativa uniforme: **America/Costa_Rica** (UTC-6).

---

## 2. Tecnologías Empleadas

### Backend
- **Node.js** (v24+) y **Express 4.21** (Módulos ES6).
- **Socket.IO 4.8** para comunicación bidireccional en tiempo real con autenticación JWT en handshake.
- **MySQL 8.0** (Motor InnoDB, `utf8mb4_unicode_ci`, Timezone UTC-6).
- **mysql2/promise** para manejo eficiente del pool de conexiones.
- **bcryptjs** para hashing unidireccional de contraseñas (10 rounds de sal).
- **jsonwebtoken** para tokens de acceso (HS256 con payload tipado y expiración).
- **cors** y **dotenv** para configuración de entorno.

### Frontend
- **React 18** y **Vite 6** (JavaScript / JSX).
- **Socket.IO Client** para suscripción a eventos en tiempo real.
- **React Router DOM 6** para enrutamiento SPA y rutas protegidas por rol con pantalla 403 personalizada.
- **Lucide React** para iconografía minimalista.
- **CSS Modular Institucional** con paleta de lujo: Negro Obsidian (`#0B0D13`), Dorado Metálico (`#D4AF37`) y Blanco Puro (`#FFFFFF`).
- Cliente HTTP centralizado con interceptor de errores unificados (`UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, etc.).

---

## 3. Estructura del Proyecto

```text
NexoEventos/
├── backend/
│   ├── migrations/                  # 11 Migraciones SQL ordenadas e idempotentes
│   │   ├── 001_create_roles.sql
│   │   ├── 002_create_clientes.sql
│   │   ├── 003_create_servicios.sql
│   │   ├── 004_create_eventos.sql
│   │   ├── 005_create_detalle_eventos.sql
│   │   ├── 006_create_usuarios.sql
│   │   ├── 007_seed_roles.sql
│   │   ├── 008_seed_initial_data.sql
│   │   ├── 009_create_calendar_tables.sql
│   │   ├── 010_seed_calendar_categories.sql
│   │   └── 011_seed_initial_schedules.sql
│   ├── src/
│   │   ├── config/                  # Conexión al pool MySQL (db.js)
│   │   ├── controllers/             # Controladores REST de todas las entidades
│   │   ├── middlewares/             # authMiddleware, roleMiddleware, errorHandler
│   │   ├── models/                  # Capa de datos MySQL (10 modelos)
│   │   ├── routes/                  # Rutas Express modulares
│   │   ├── scripts/                 # Migrador automático y suite de 69 pruebas
│   │   ├── services/                # socketService.js para WebSocket en tiempo real
│   │   ├── utils/                   # response.js (estándar unificado), icsExporter.js
│   │   ├── app.js                   # Configuración del servidor Express
│   │   └── server.js                # Entrada HTTP + WebSocket
│   ├── .env                         # Variables de entorno locales
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/              # Layout, Navbar, Sidebar, Modales, Toast
│   │   │   └── calendar/            # Header, SummaryCards, Weekly, Monthly, Daily, Drawer, Form
│   │   ├── context/                 # AuthContext (Sesión, token, rol, permisos)
│   │   ├── pages/                   # CalendarioPage, Dashboard, Clientes, Servicios, Eventos...
│   │   ├── routes/                  # AppRoutes con control estricto RBAC
│   │   ├── services/                # api.js, socket.js, scheduleService.js, etc.
│   │   ├── styles/                  # index.css, calendar.css (diseño negro y dorado)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── nexoeventos.sql              # Volcado consolidado DDL y DML (10 tablas)
├── docs/
│   ├── investigacion-jwt.md         # Investigación teórica sobre JWT
│   ├── modelo-entidad-relacion.drawio # Diagrama ERD completo (10 tablas)
│   ├── pruebas-api.json             # Colección exportable para Postman / Thunder Client
│   ├── cumplimiento-academico.md    # Matriz de cumplimiento
│   └── auditoria-integral-final.md  # Informe exhaustivo de auditoría y resultados
└── README.md
```

---

## 4. Base de Datos y Modelo Relacional (10 Tablas)

El modelo de datos se compone de 10 tablas relacionadas en MySQL 8.0:

### 4.1 Entidades del Core Comercial
1. **`roles`**: Catálogo cerrado de 3 roles (`administrador`, `supervisor`, `cliente`).
2. **`usuarios`**: Cuentas con hash `bcrypt`, relación 1:N hacia roles y 1:1 opcional hacia clientes.
3. **`clientes`**: Titulares de contratos (`persona` o `empresa`).
4. **`servicios`**: Catálogo comercial de prestaciones con estado activo/inactivo.
5. **`eventos`**: Planificación de eventos con estado y relación hacia cliente.
6. **`detalle_eventos`**: Desglose con congelación de precio histórico pactado.

### 4.2 Entidades del Módulo de Calendario
7. **`categorias_agenda`**: Catálogo de 4 categorías con colores distintivos:
   - `Event` (`#D4AF37` — Dorado): Actividades de eventos comerciales.
   - `Meeting` (`#3B82F6` — Azul): Reuniones de coordinación y trato con clientes.
   - `Setup and Rehearsal` (`#F59E0B` — Ámbar): Montajes, ensayos técnicos y pruebas.
   - `Task Deadlines` (`#EC4899` — Rosa): Hitos y fechas límite operativas.
8. **`agendas`**: Citas y actividades con horario (`fecha_inicio`, `fecha_fin`), ubicación, categoría, responsable (PIC) y vínculo opcional al evento comercial.
9. **`agenda_integrantes`**: Tabla asociativa N:M entre `agendas` y `usuarios` para el equipo operativo asignado.
10. **`agenda_notas`**: Checklist y notas operativas asociadas a la agenda con marca de completitud (`completada`).

---

## 5. Separación Estricta de Roles (RBAC)

El sistema impone una estricta barrera de privilegios tanto en frontend como en backend:

| Módulo / Acción | Administrador | Supervisor | Cliente |
|---|:---:|:---:|:---:|
| **Gestión de Usuarios** | Total | **PROHIBIDO (HTTP 403)** | **PROHIBIDO (HTTP 403)** |
| **Catálogo de Roles** | Gestión protegida | **PROHIBIDO (HTTP 403)** | **PROHIBIDO (HTTP 403)** |
| **Clientes, Servicios y Eventos** | Total | Total | Solo sus propios eventos y servicios activos |
| **Calendario General** | Total | Total | Solo actividades de categoría `Event` propias |
| **Crear y Modificar Agendas** | Total | Total | Prohibido |
| **Reagendar por Drag & Drop** | Total | Total | Prohibido |
| **Asignar Equipo y Notas** | Total | Total | Oculto y bloqueado |
| **Exportar iCalendar (.ics)** | Total | Total | Solo de sus eventos |
| **Eliminar Último Administrador** | **Bloqueado (HTTP 409)** | **Bloqueado (HTTP 403)** | **Bloqueado (HTTP 403)** |

> **Garantía de Seguridad:** Si un supervisor intenta acceder a `/usuarios` o `/roles` ingresando la URL directamente en el navegador, el sistema no carga datos y presenta una pantalla formal de **403 — Acceso Restringido**. Cualquier llamada directa a la API `/api/usuarios` responde `403 Forbidden` con código `FORBIDDEN`.

---

## 6. Estándar Unificado de Errores HTTP

Todas las respuestas de error siguen estrictamente el esquema JSON unificado:

```json
{
  "success": false,
  "message": "Mensaje legible para el usuario",
  "error": {
    "code": "CODIGO_ESTANDAR",
    "message": "Descripción técnica concisa",
    "details": {}
  }
}
```

### Códigos Estándar Implementados:
- `401 Unauthorized` (`UNAUTHORIZED` / `TOKEN_EXPIRED`): `"No has iniciado sesión o tu sesión ha expirado."`
- `403 Forbidden` (`FORBIDDEN`): `"No tienes permisos para realizar esta operación."`
- `400 Bad Request` (`BAD_REQUEST`): Datos incompletos o tipos no válidos.
- `404 Not Found` (`NOT_FOUND`): Recurso inexistente en base de datos.
- `409 Conflict` (`CONFLICT`): Solapamientos de horario, violaciones de unicidad o eliminación de registros con dependencias activas.
- `500 Internal Server Error` (`INTERNAL_ERROR`): Errores inesperados del servidor.

---

## 7. Configuración e Instalación

### 7.1 Configuración de Variables de Entorno
En `backend/.env`:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=nexoeventos
JWT_SECRET=nexoeventos_jwt_super_secret_key_production_2026_enterprise_auth_system
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
TIMEZONE=America/Costa_Rica
```

### 7.2 Instalación y Migraciones

```powershell
# Instalar dependencias del Backend
cd NexoEventos/backend
npm install

# Ejecutar las 11 migraciones SQL
npm run migrate

# Instalar dependencias del Frontend
cd ../frontend
npm install
```

---

## 8. Ejecución del Sistema

### Iniciar Backend (Puerto 5000)
```powershell
cd NexoEventos/backend
npm start
# O en modo desarrollo:
npm run dev
```

### Iniciar Frontend (Puerto 5173)
```powershell
cd NexoEventos/frontend
npm run dev
```

Abra su navegador en: `http://localhost:5173`

---

## 9. Credenciales de Demostración

| Rol | Correo Electrónico | Contraseña | Alcance de Permisos |
|---|---|---|---|
| **Administrador** | `admin@nexoeventos.com` | `Admin1234*` | Control total, administración de usuarios, roles, agendas y eventos. |
| **Supervisor** | `supervisor@nexoeventos.com` | `Supervisor1234*` | Control operativo de eventos, clientes, servicios y calendario. Sin acceso a usuarios ni roles. |
| **Cliente** | `cliente@empresa.com` | `Cliente1234*` | Portal privado para solicitar eventos y consultar agenda propia. |

---

## 10. Suite de Pruebas Automatizadas (69/69 Aprobadas)

Con el backend en ejecución, ejecute la suite de verificación exhaustiva:

```powershell
cd NexoEventos/backend
npm run test:api
```

La suite valida automáticamente 69 escenarios en tiempo real:
- Health check y conexión a MySQL 8.0.
- Rutas públicas vs privadas sin token (HTTP 401).
- Cifrado seguro bcrypt y firmas JWT.
- Aislamiento RBAC estricto (Supervisor bloqueado en `GET /usuarios`, `GET /usuarios/:id` y `POST /usuarios` con HTTP 403).
- Bloqueo de eliminación del último administrador activo (HTTP 409).
- CRUD completo de roles, clientes, servicios, eventos y detalle de eventos.
- Regla de congelación de precios históricos en detalle de eventos.
- Vistas de calendario: semanal (Lunes a Domingo), mensual y diaria.
- Resumen y contadores agregados por categoría.
- Detección de solapamiento de horarios (HTTP 409 Conflict) para responsable e integrantes.
- Reagendamiento mediante Drag & Drop (`PATCH /schedules/:id/reschedule`).
- Checklist y notas operativas (creación, toggle y eliminación).
- Asignación y desasignación de personal operativo.
- Generación y exportación de archivos válidos **RFC 5545 iCalendar (.ics)**.
- Aislamiento estricto de privacidad para cuentas con rol cliente.

---

## 11. Documentación Técnica de Auditoría y Refinamiento

Para consultar los informes de verificación técnica, arquitectura y seguridad:
- [Informe de Auditoría y Refinamiento Final](docs/auditoria-refinamiento-final.md): Reporte exhaustivo con los 15 puntos requeridos, resolución de causas de error 403, desacoplamiento de dashboards, eliminación integral de emojis y flujo comercial validado.
- [Informe de Auditoría Integral Previa](docs/auditoria-integral-final.md): Análisis de código, endpoints y arquitectura relacional.
- [Matriz de Cumplimiento Académico](docs/cumplimiento-academico.md): Mapeo punto por punto de requisitos técnicos y funcionales del proyecto.
- [Investigación de Seguridad JWT y RBAC](docs/investigacion-jwt.md): Buenas prácticas y justificación de directivas de seguridad implementadas.
