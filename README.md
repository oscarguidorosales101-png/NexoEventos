# NexoEventos
### Gestión inteligente de eventos, coordinación operativa y planificación empresarial

**Una plataforma. Cada detalle bajo control.**

NexoEventos es una plataforma web de gestión empresarial diseñada para centralizar la administración, planificación y coordinación de eventos sociales y corporativos. Integra la gestión comercial, el control de servicios, la programación de actividades y la comunicación operativa en un único entorno digital.

Su propósito es simplificar el trabajo de las empresas organizadoras de eventos, reducir la desorganización administrativa, mejorar la coordinación de los equipos y proporcionar una visión clara de cada proyecto, desde la solicitud inicial del cliente hasta su ejecución.

---

## 1. Identidad y propósito empresarial

### Nuestra visión

En la organización de eventos, cada detalle importa. Una fecha mal coordinada, un servicio sin confirmar o un integrante que desconoce sus responsabilidades puede afectar toda una operación.

NexoEventos nace para resolver ese problema.

La plataforma transforma procesos que habitualmente se encuentran dispersos entre hojas de cálculo, mensajes, documentos y calendarios independientes en un sistema centralizado, organizado y accesible.

### Problema que resuelve

Las empresas dedicadas a la planificación de eventos suelen enfrentarse a dificultades como:

- Información de clientes distribuida en diferentes herramientas.
- Dificultad para controlar solicitudes, cotizaciones y confirmaciones.
- Desorganización de fechas, horarios y actividades.
- Falta de comunicación entre responsables y equipos operativos.
- Conflictos de disponibilidad y asignaciones simultáneas.
- Ausencia de seguimiento sobre tareas y responsabilidades.
- Riesgo de pérdida de información comercial y operativa.

### Nuestra solución

NexoEventos proporciona un entorno centralizado que permite:

- Administrar clientes y relaciones comerciales.
- Gestionar servicios y sus respectivos precios.
- Registrar y controlar eventos.
- Programar agendas vinculadas a eventos comerciales.
- Asignar responsables principales y equipos de trabajo.
- Supervisar actividades mediante un calendario dinámico.
- Detectar conflictos de horarios antes de confirmar una asignación.
- Mantener actualizada la información mediante sincronización en tiempo real.

### Público objetivo

- Empresas organizadoras de eventos.
- Agencias de planificación de bodas y celebraciones.
- Productoras de eventos corporativos.
- Empresas de convenciones y congresos.
- Equipos de coordinación y producción.
- Negocios especializados en servicios para eventos.

---

## 2. Módulos principales

### 2.1 Gestión comercial

Centraliza la información de los clientes y las operaciones comerciales.

Incluye:

- Registro y administración de clientes particulares y empresariales.
- Catálogo de servicios profesionales.
- Gestión de precios y disponibilidad de servicios.
- Registro y seguimiento de eventos.
- Estados comerciales: pendiente, confirmado, completado y cancelado.
- Asociación de servicios contratados a cada evento.
- Conservación del precio histórico acordado mediante el detalle del evento.

### 2.2 Calendario y planificación operativa

El calendario constituye uno de los núcleos principales de NexoEventos.

Permite visualizar y organizar las actividades de la empresa desde una interfaz centralizada.

**Modalidades de visualización:**

- Semanal: distribución de lunes a domingo, con horario operativo de 08:00 a 20:00.
- Mensual: visualización general de actividades y compromisos.
- Diaria: seguimiento cronológico de las actividades de una fecha determinada.

**Funcionalidades:**

- Creación, edición y eliminación de agendas.
- Vinculación de agendas con eventos comerciales.
- Asignación de responsables principales (PIC).
- Incorporación de integrantes del equipo.
- Reprogramación mediante Drag & Drop.
- Detección de conflictos de disponibilidad.
- Notas y listas de tareas operativas.
- Indicadores de actividades por categoría.
- Exportación de agendas mediante iCalendar (.ics).

**Categorías institucionales:**

| Categoría | Identificación | Uso |
|---|---|---|
| Event | Dorado | Actividades vinculadas a eventos comerciales |
| Meeting | Azul | Reuniones y coordinación |
| Setup and Rehearsal | Ámbar | Montajes, ensayos y preparación |
| Task Deadlines | Rosa | Entregas y fechas límite |

### 2.3 Sincronización en tiempo real

La plataforma utiliza Socket.IO para mantener sincronizada la información entre los usuarios conectados.

Cuando se crea, modifica, reprograma o elimina una actividad, los usuarios autorizados reciben las actualizaciones correspondientes sin necesidad de recargar la página.

La comunicación utiliza conexiones autenticadas mediante JWT y mecanismos de segmentación para mantener la privacidad de la información.

### 2.4 Control administrativo

El administrador dispone de herramientas para gestionar los recursos generales de la plataforma, controlar usuarios, consultar información y supervisar las operaciones.

---

## 3. Arquitectura tecnológica

NexoEventos utiliza una arquitectura desacoplada que separa la presentación, la lógica de negocio y la persistencia de información.

```text
                 NEXOEVENTOS
                      |
          +-----------+-----------+
          |                       |
       FRONTEND                 BACKEND
       React                   Node.js
       Vite                    Express
          |                       |
          |                  API REST
          |                       |
          |                  Middleware
          |                  JWT / RBAC
          |                       |
          |                  Controllers
          |                       |
          |                    Models
          |                       |
          |                    MySQL
          |                       |
          +------ Socket.IO ------+
                   Tiempo real
```

### Tecnologías utilizadas

**Frontend**

- React 18.
- Vite 6.
- JavaScript y JSX.
- React Router DOM.
- Socket.IO Client.
- Lucide React.
- CSS modular.

**Backend**

- Node.js.
- Express 4.
- JavaScript con módulos ES.
- MySQL2.
- Socket.IO 4.
- JSON Web Token (JWT).
- Bcryptjs.
- Dotenv.

**Base de datos**

- MySQL 8.0.
- Motor de almacenamiento InnoDB.
- Codificación utf8mb4.
- Relaciones mediante claves foráneas.
- Migraciones SQL versionadas.

---

## 4. Estructura del proyecto

```text
NexoEventos/
│
├── backend/
│   ├── migrations/
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
│   │   ├── 011_seed_initial_schedules.sql
│   │   └── 012_prevent_duplicate_event_schedules.sql
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── calendar/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── nexoeventos.sql
│
├── docs/
│   ├── investigacion-jwt.md
│   ├── modelo-entidad-relacion.drawio
│   ├── pruebas-api.json
│   ├── cumplimiento-academico.md
│   ├── auditoria-integral-final.md
│   └── informe-depuracion-final-mysql.md
│
├── .gitignore
└── README.md
```

---

## 5. Modelo de datos

La base de datos está organizada en diez entidades principales.

| Tabla | Responsabilidad |
|---|---|
| roles | Catálogo de roles del sistema |
| usuarios | Cuentas y datos de acceso |
| clientes | Información de clientes particulares y empresariales |
| servicios | Catálogo de prestaciones comerciales |
| eventos | Registro y seguimiento de eventos |
| detalle_eventos | Servicios asociados y precios pactados |
| categorias_agenda | Clasificación de actividades |
| agendas | Programación de actividades y responsables |
| agenda_integrantes | Relación entre agendas y personal |
| agenda_notas | Notas y tareas operativas |

### Integridad de los datos

El modelo utiliza relaciones referenciales para evitar registros inconsistentes.

También incorpora:

- Restricciones de unicidad.
- Validaciones de relaciones.
- Protección de registros con dependencias.
- Control de operaciones mediante transacciones.
- Índices para consultas frecuentes.
- Migraciones versionadas.

La migración 012 incorpora una restricción de unicidad condicional para impedir que un mismo evento comercial tenga varias agendas principales.

---

## 6. Seguridad y control de acceso (RBAC)

NexoEventos utiliza tres roles diferenciados, cada uno con responsabilidades específicas.

| Funcionalidad | Administrador | Supervisor | Cliente |
|---|---|---|---|
| Gestión de usuarios | Permitido | Restringido | Restringido |
| Gestión de roles | Permitido | Restringido | Restringido |
| Gestión comercial | Completo | Operativo | Propia información |
| Gestión de eventos | Completo | Operativo | Propios eventos |
| Calendario | Completo | Completo | Actividades propias permitidas |
| Crear agendas | Permitido | Permitido | Restringido |
| Modificar agendas | Permitido | Permitido | Restringido |
| Asignar integrantes | Permitido | Permitido | Restringido |
| Gestionar notas | Permitido | Permitido | Restringido |

### Principios de seguridad

La seguridad no depende únicamente de ocultar botones o secciones de la interfaz.

Las restricciones se aplican también en el backend mediante middleware de autenticación y autorización.

Se contemplan las siguientes respuestas:

- **401 Unauthorized:** sesión inexistente, inválida o expirada.
- **403 Forbidden:** usuario autenticado sin autorización.
- **400 Bad Request:** información inválida.
- **404 Not Found:** recurso inexistente.
- **409 Conflict:** conflicto de integridad o de operación.
- **500 Internal Server Error:** error interno controlado.

Las contraseñas se almacenan mediante hashing y nunca deben exponerse a través de las respuestas de la API.

---

## 7. Configuración e instalación

### Requisitos previos

- Node.js y npm.
- MySQL Server 8.0.
- Git.
- Un navegador moderno.
- Dependencias de backend y frontend.

### 7.1 Obtener el proyecto

```bash
git clone URL_DEL_REPOSITORIO
cd NexoEventos
```

### 7.2 Configurar el backend

```bash
cd backend
npm install
```

Crear un archivo `.env` a partir de `.env.example`.

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configurar las variables privadas con los datos de la instalación local:

```dotenv
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=USUARIO_LOCAL
DB_PASSWORD=CONTRASENA_LOCAL
DB_NAME=nexoeventos

JWT_SECRET=GENERAR_UNA_CLAVE_PRIVADA_SEGURA
JWT_EXPIRES_IN=8h

CLIENT_URL=http://localhost:5173
TIMEZONE=America/Costa_Rica
```

Los valores anteriores son una plantilla. Las credenciales reales deben permanecer exclusivamente en el archivo `.env` local.

### 7.3 Preparar MySQL

Crear la base de datos:

```sql
CREATE DATABASE nexoeventos
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Ejecutar las migraciones desde el backend:

```bash
npm run migrate
```

### 7.4 Instalar el frontend

Abrir otra terminal:

```bash
cd NexoEventos/frontend
npm install
```

---

## 8. Puesta en marcha

### Backend

Desde `backend/`:

```bash
npm start
```

Servicio:

```text
http://localhost:5000
```

### Frontend

Desde `frontend/`:

```bash
npm run dev
```

Aplicación:

```text
http://localhost:5173
```

Ambos servicios deben estar activos para utilizar la plataforma completa.

---

## 9. Validación y pruebas

La calidad del sistema se verifica mediante diferentes niveles de pruebas.

### 9.1 API y seguridad

```bash
cd backend
npm run test:api
```

Resultado documentado: **84/84 pruebas aprobadas**.

Comprueba autenticación, permisos, operaciones CRUD, validaciones, integridad comercial, calendario y conflictos.

### 9.2 Persistencia MySQL

```bash
npm run test:persistence
```

Verifica las diez entidades mediante consultas directas a MySQL, incluyendo creación, consulta, actualización y eliminación.

### 9.3 Flujo comercial

```bash
npm run test:commercial
```

Comprueba el recorrido de una operación comercial desde la solicitud hasta su aprobación, programación y asignación de personal.

### 9.4 Sincronización Socket.IO

```bash
npm run test:socket
```

Comprueba conexiones autenticadas, comunicación entre sesiones y aislamiento de salas.

Resultado documentado: **17/17 aserciones aprobadas**.

### 9.5 Pruebas de interfaz

Desde `frontend/`:

```bash
npm run test:e2e
```

Utiliza Puppeteer y Chromium para verificar interacciones reales en la interfaz y los tres perfiles de usuario.

### 9.6 Compilación de producción

Desde `frontend/`:

```bash
npm run build
```

Genera la versión optimizada de producción.

---

## 10. Protección de información y configuración privada

NexoEventos separa la documentación pública de los datos internos de configuración.

### Información que puede compartirse

- Código fuente autorizado.
- Arquitectura del sistema.
- Modelo entidad-relación.
- Migraciones SQL.
- Documentación técnica.
- Ejemplos de configuración sin secretos.
- Pruebas automatizadas.
- Datos de demostración ficticios.

### Información que debe permanecer privada

- Archivo `backend/.env`.
- Contraseñas de MySQL.
- Claves JWT.
- Tokens de autenticación.
- Credenciales personales.
- Respaldos que contengan información real de clientes.
- Datos personales y registros privados de producción.

### Reglas obligatorias

1. Nunca publicar archivos `.env`.
2. Nunca incluir contraseñas reales en el README.
3. Utilizar `.env.example` para documentar las variables necesarias.
4. No subir respaldos con información personal o credenciales.
5. No incluir tokens ni secretos en capturas de pantalla.
6. Mantener las credenciales de demostración separadas de las cuentas privadas.

Los profesores pueden revisar la estructura, ejecutar el proyecto y verificar su funcionamiento utilizando una configuración propia, sin necesidad de acceder a los secretos del entorno original.

---

## 11. Documentación complementaria

La carpeta `docs/` reúne los documentos que permiten comprender y evaluar el desarrollo:

| Documento | Contenido |
|---|---|
| `investigacion-jwt.md` | Investigación sobre autenticación y seguridad JWT |
| `modelo-entidad-relacion.drawio` | Representación visual del modelo relacional |
| `pruebas-api.json` | Colección de solicitudes para Postman o Thunder Client |
| `cumplimiento-academico.md` | Correspondencia entre requisitos y funcionalidades |
| `auditoria-integral-final.md` | Resultados de la auditoría técnica |
| `informe-depuracion-final-mysql.md` | Evidencias de la depuración controlada |

---

## 12. Identidad y compromiso de NexoEventos

NexoEventos representa una forma más organizada de gestionar el trabajo detrás de cada evento.

No se trata solamente de almacenar clientes, registrar fechas o mostrar actividades en un calendario. Se trata de conectar personas, responsabilidades, servicios y operaciones dentro de un mismo sistema.

Su enfoque está basado en tres principios:

**Organización:** cada actividad, cliente y servicio debe tener información clara y centralizada.

**Coordinación:** cada integrante debe conocer sus responsabilidades y los compromisos del equipo.

**Confianza:** la información debe mantenerse protegida, íntegra y disponible para quienes tienen autorización.

La tecnología debe facilitar el trabajo, no complicarlo.

Por eso, NexoEventos busca que las empresas puedan dedicar menos tiempo a organizar información dispersa y más tiempo a ofrecer experiencias memorables.

---

**NexoEventos**

*Cada evento tiene una historia. Nosotros ayudamos a organizar cada detalle para hacerla posible.*
