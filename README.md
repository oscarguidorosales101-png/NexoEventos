# NexoEventos — Plataforma Empresarial de Gestión de Eventos

> **Mini Proyecto 1 · Día 2: Completar los CRUDs e incorporar autenticación JWT**  
> Sistema de gestión administrativa para empresas de eventos sociales y corporativos, desarrollado con arquitectura desacoplada: API REST en **Node.js + Express**, base de datos relacional en **MySQL 8.0** y cliente web interactivo en **React + Vite**.

---

## 1. Propósito del Sistema

**NexoEventos** es una plataforma corporativa privada diseñada para planificar, coordinar y cotizar eventos de alta gama (bodas, convenciones empresariales, galas, aniversarios y lanzamientos). 

El sistema centraliza:
- El registro de clientes (personas naturales y empresas).
- El catálogo de servicios de organización, catering, fotografía, sonido y producción.
- La programación y seguimiento de eventos con control de estados (*pendiente*, *confirmado*, *completado*, *cancelado*).
- El desglose detallado de servicios por evento con precio unitario congelado/pactado.
- La gestión de usuarios y seguridad con autenticación JWT y autorización basada en tres roles funcionales: **administrador**, **supervisor** y **cliente**.

---

## 2. Tecnologías Empleadas

### Backend
- **Node.js** (v24+) y **Express 4.21** (Módulos ES6).
- **MySQL 8.0** (Motor InnoDB, `utf8mb4_unicode_ci`).
- **mysql2/promise** para manejo de pool de conexiones asíncronas.
- **bcryptjs** para hashing unidireccional de contraseñas (10 rounds).
- **jsonwebtoken** para emisión y verificación de tokens JWT (HS256).
- **cors** y **dotenv** para configuración de entorno.

### Frontend
- **React 18** y **Vite 6** (JavaScript / JSX).
- **React Router DOM 6** para enrutamiento SPA y rutas protegidas por rol.
- **Lucide React** para iconografía minimalista y corporativa.
- **CSS Modular Institucional** con paleta de lujo: Negro Obsidian (`#0B0D13`), Dorado Metálico (`#D4AF37`) y Blanco Puro (`#FFFFFF`).
- Consumo centralizado de API con inyección automática de cabecera `Authorization: Bearer <token>` y captura de 401.

---

## 3. Estructura del Proyecto

```text
NexoEventos/
├── backend/
│   ├── migrations/                  # Migraciones SQL ordenadas e idempotentes
│   │   ├── 001_create_roles.sql
│   │   ├── 002_create_clientes.sql
│   │   ├── 003_create_servicios.sql
│   │   ├── 004_create_eventos.sql
│   │   ├── 005_create_detalle_eventos.sql
│   │   ├── 006_create_usuarios.sql
│   │   ├── 007_seed_roles.sql
│   │   └── 008_seed_initial_data.sql
│   ├── src/
│   │   ├── config/                  # Conexión al pool de MySQL
│   │   ├── controllers/             # Controladores de las 6 entidades y auth
│   │   ├── middlewares/             # authMiddleware, roleMiddleware, errorHandler
│   │   ├── models/                  # Capa de acceso a datos MySQL
│   │   ├── routes/                  # Rutas modulares de Express
│   │   ├── scripts/                 # Migrador automático y suite de pruebas
│   │   ├── utils/                   # Validadores y formateadores de respuesta
│   │   ├── app.js                   # Configuración del servidor Express
│   │   └── server.js                # Punto de entrada HTTP
│   ├── .env                         # Variables de entorno locales
│   ├── .env.example                 # Plantilla de variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/              # Layout, Navbar, Sidebar, Modales, RutasProtegidas
│   │   ├── context/                 # AuthContext (Sesión, token, usuario actual)
│   │   ├── pages/                   # Login, Registro, Dashboard, Clientes, Servicios, Eventos...
│   │   ├── routes/                  # Configuración de rutas AppRoutes
│   │   ├── services/                # api.js centralizado y servicios por entidad
│   │   ├── styles/                  # Sistema de diseño CSS negro y dorado
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── nexoeventos.sql              # Exportación consolidada DDL y DML
├── docs/
│   ├── investigacion-jwt.md         # Deep research obligatorio sobre JWT (15 puntos)
│   ├── modelo-entidad-relacion.drawio # Diagrama ERD compatible con Draw.io
│   ├── pruebas-api.json             # Colección exportable para Thunder Client / Postman
│   └── cumplimiento-academico.md    # Matriz de auditoría de requisitos del Día 2
├── .gitignore
└── README.md
```

---

## 4. Requisitos Previos

- **Node.js** v18 o superior instalado en el equipo.
- **MySQL 8.0** en ejecución local (puerto estándar `3306`).
- Administrador de paquetes **npm**.

---

## 5. Configuración e Instalación

### 5.1 Configuración de Variables de Entorno del Backend
Dentro de la carpeta `backend/`, verifique o configure el archivo `.env`:

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
```

> **Nota de Seguridad:** Se provee un archivo `backend/.env.example` como plantilla libre de credenciales. El archivo real `.env` está expresamente ignorado en git.

---

### 5.2 Instalación de Dependencias

```powershell
# Instalar dependencias del Backend
cd NexoEventos/backend
npm install

# Instalar dependencias del Frontend
cd ../frontend
npm install
```

---

## 6. Base de Datos y Migraciones

NexoEventos incluye un sistema de migraciones nativo en Node.js que:
1. Crea automáticamente la base de datos `nexoeventos` si no existe.
2. Crea la tabla de control `schema_migrations`.
3. Aplica de forma secuencial e idempotente los 8 scripts SQL de `backend/migrations/`.
4. Si se vuelve a ejecutar, salta de manera segura las migraciones ya aplicadas.

### Comandos de Migración:

```powershell
# Ejecutar migraciones pendientes
cd NexoEventos/backend
npm run migrate

# Verificar el estado y timestamp de las migraciones
npm run migrate:status
```

---

## 7. Ejecución de la Aplicación

### Iniciar el Backend (Puerto 5000)
```powershell
cd NexoEventos/backend
npm start
# O en modo desarrollo con recarga automática:
npm run dev
```
*El servidor reportará la conexión exitosa a MySQL y habilitará los endpoints en `http://localhost:5000/api`.*

### Iniciar el Frontend (Puerto 5173)
En otra terminal:
```powershell
cd NexoEventos/frontend
npm run dev
```
*Abra en su navegador `http://localhost:5173` para ingresar a la plataforma.*

---

## 8. Credenciales de Demostración y Prueba

Para facilitar la evaluación de los tres roles funcionales, el sistema cuenta con usuarios iniciales precargados mediante las migraciones. La pantalla de login incluye botones de auto-llenado rápido:

| Rol | Correo Electrónico | Contraseña | Alcance de Permisos |
|---|---|---|---|
| **Administrador** | `admin@nexoeventos.com` | `Admin1234*` | Control completo de todas las entidades, administración de usuarios y catálogo de roles. |
| **Supervisor** | `supervisor@nexoeventos.com` | `Supervisor1234*` | CRUD operativo de clientes, servicios y eventos. Supervisión en solo lectura de usuarios. No puede modificar cuentas ni roles. |
| **Cliente** | `cliente@empresa.com` | `Cliente1234*` | Acceso a sus propios eventos, cotización en tiempo real y catálogo de servicios activos. Bloqueado de datos de terceros. |

> Todas las contraseñas se almacenan mediante hashes de `bcrypt` con 10 rondas de sal.

---

## 9. Pruebas Automatizadas y Colección API

### Ejecución de la Suite de Pruebas del Backend (51/51 Aprobadas)
Con el servidor backend en ejecución, ejecute:

```powershell
cd NexoEventos/backend
npm run test:api
```

La suite comprueba:
- Código HTTP 200 en health check.
- Código HTTP 401 en accesos no autenticados o con tokens corruptos.
- Código HTTP 400 en contraseñas cortas o correos duplicados.
- Código HTTP 403 en violaciones de roles (RBAC) y violaciones de propiedad de datos.
- Código HTTP 404 en consultas de recursos inexistentes o claves foráneas inválidas.
- Código HTTP 409 en eliminación de registros con dependencias asociadas (integridad referencial sin huérfanos).
- Protección crítica contra degradación o eliminación del último administrador activo.
- CRUD completo en las 6 entidades (`roles`, `clientes`, `servicios`, `eventos`, `detalle_eventos`, `usuarios`).

### Colección de Pruebas Exportable (Postman / Thunder Client)
El archivo consolidado listo para importar se encuentra en:
`docs/pruebas-api.json`

---

## 10. Matriz de Roles y Autorización (RBAC)

| Módulo / Acción | Administrador | Supervisor | Cliente |
|---|:---:|:---:|:---:|
| **CRUD Clientes** | ✔ Total | ✔ Total | ❌ (Solo ver y editar su propio perfil) |
| **CRUD Servicios** | ✔ Total | ✔ Total | 👁 Solo lectura de servicios activos |
| **CRUD Eventos** | ✔ Total | ✔ Total | ✔ Solicitar eventos (estado pendiente) y ver los propios |
| **CRUD Detalle Eventos** | ✔ Total | ✔ Total | ✔ Ver detalle propio y agregar servicios a solicitud pendiente |
| **Gestión de Usuarios** | ✔ Total | 👁 Solo lectura | ❌ Prohibido (HTTP 403) |
| **Catálogo de Roles** | ✔ Gestión protegida | ❌ Prohibido (HTTP 403) | ❌ Prohibido (HTTP 403) |
| **Eliminar Último Admin**| ❌ Bloqueado (HTTP 409)| ❌ Bloqueado (HTTP 403) | ❌ Bloqueado (HTTP 403) |

---

## 11. Entregables Académicos Incluidos

1. `docs/investigacion-jwt.md`: Análisis a fondo de 15 puntos de JWT, XSS vs CSRF, almacenamiento y fuentes consultadas.
2. `docs/modelo-entidad-relacion.drawio`: Diagrama relacional XML estándar con las 6 entidades y cardinalidades.
3. `docs/cumplimiento-academico.md`: Matriz de correspondencia punto por punto contra los criterios del PDF del Día 2.
4. `database/nexoeventos.sql`: Volcado consolidado DDL y DML de la base de datos.
5. `backend/migrations/`: Conjunto de 8 migraciones ejecutables con `npm run migrate`.
6. Código fuente completo y probado de backend y frontend.

