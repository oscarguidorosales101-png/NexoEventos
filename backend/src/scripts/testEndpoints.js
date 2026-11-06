import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

let passedTests = 0;
let failedTests = 0;

let adminToken = null;
let supervisorToken = null;
let clientToken = null;

const testCreatedIds = {
  users: [],
  clients: [],
  events: [],
  details: [],
  schedules: [],
  services: []
};

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message} - ${details}`);
    failedTests++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { error: 'Failed to parse JSON', raw: await response.text() };
  }

  return { status: response.status, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('[SUITE] SUITE DE PRUEBAS AUTOMATIZADAS - API NEXOEVENTOS');
  console.log(`[TARGET] URL Objetivo: ${BASE_URL}`);
  console.log('======================================================\n');

  try {

  // 1. Health check
  console.log('--- 1. Health Check & Estado Inicial ---');
  const health = await request('/health');
  assert(health.status === 200 && health.data.status === 'online', 'Health check responde 200 OK');

  // 2. Seguridad: Rutas protegidas sin token (401)
  console.log('\n--- 2. Verificación de Seguridad y Rutas sin Token (401) ---');
  const noTokenServicios = await request('/servicios');
  assert(noTokenServicios.status === 401, 'GET /servicios sin token responde 401 Unauthorized');

  const noTokenEventos = await request('/eventos');
  assert(noTokenEventos.status === 401, 'GET /eventos sin token responde 401 Unauthorized');

  const noTokenMe = await request('/auth/me');
  assert(noTokenMe.status === 401, 'GET /auth/me sin token responde 401 Unauthorized');

  const noTokenRoles = await request('/roles');
  assert(noTokenRoles.status === 401, 'GET /roles sin token responde 401 Unauthorized');

  const invalidToken = await request('/servicios', {
    headers: { Authorization: 'Bearer token_falso_invalido_12345' }
  });
  assert(invalidToken.status === 401, 'GET /servicios con token inválido responde 401 Unauthorized');

  // 3. Autenticación y Registro
  console.log('\n--- 3. Registro y Login de Usuarios ---');
  const shortPass = await request('/auth/register', {
    method: 'POST',
    body: {
      nombre: 'Prueba Corta',
      correo: `test_${Date.now()}@nexoeventos.com`,
      password: '123'
    }
  });
  assert(shortPass.status === 400, 'Registro con contraseña < 8 caracteres responde 400 Bad Request');

  const invalidMail = await request('/auth/register', {
    method: 'POST',
    body: {
      nombre: 'Prueba Correo',
      correo: 'correo_sin_arroba',
      password: 'PasswordSeguro123*'
    }
  });
  assert(invalidMail.status === 400, 'Registro con correo inválido responde 400 Bad Request');

  const uniqueMail = `nuevo_cliente_${Date.now()}@empresa.com`;
  const registerOk = await request('/auth/register', {
    method: 'POST',
    body: {
      nombre: 'Cliente Automatizado S.A.',
      correo: uniqueMail,
      password: 'Password123*',
      tipo_cliente: 'empresa',
      telefono: '+57 3001234567',
      direccion: 'Av. Las Palmas # 20'
    }
  });
  assert(registerOk.status === 201 && registerOk.data.data.rol === 'cliente', 'Registro exitoso responde 201 Created con rol cliente');
  const registeredUserId = registerOk.data?.data?.id_usuario;
  const registeredClientId = registerOk.data?.data?.id_cliente;
  if (registeredUserId) testCreatedIds.users.push(registeredUserId);
  if (registeredClientId) testCreatedIds.clients.push(registeredClientId);

  const duplicateRegister = await request('/auth/register', {
    method: 'POST',
    body: {
      nombre: 'Cliente Duplicado',
      correo: uniqueMail,
      password: 'Password123*'
    }
  });
  assert(duplicateRegister.status === 400, 'Registro con correo duplicado responde 400 Bad Request');

  const loginBadPass = await request('/auth/login', {
    method: 'POST',
    body: {
      correo: 'admin@nexoeventos.com',
      password: 'PasswordEquivocada!'
    }
  });
  assert(loginBadPass.status === 401, 'Login con contraseña incorrecta responde 401 Unauthorized');

  // Login de los 3 roles
  const loginAdmin = await request('/auth/login', {
    method: 'POST',
    body: {
      correo: 'admin@nexoeventos.com',
      password: 'Admin1234*'
    }
  });
  assert(loginAdmin.status === 200 && loginAdmin.data.data.token, 'Login Administrador exitoso (200 OK con JWT)');
  adminToken = loginAdmin.data?.data?.token;

  const loginSupervisor = await request('/auth/login', {
    method: 'POST',
    body: {
      correo: 'supervisor@nexoeventos.com',
      password: 'Supervisor1234*'
    }
  });
  assert(loginSupervisor.status === 200 && loginSupervisor.data.data.token, 'Login Supervisor exitoso (200 OK con JWT)');
  supervisorToken = loginSupervisor.data?.data?.token;

  const loginCliente = await request('/auth/login', {
    method: 'POST',
    body: {
      correo: 'cliente@empresa.com',
      password: 'Cliente1234*'
    }
  });
  assert(loginCliente.status === 200 && loginCliente.data.data.token, 'Login Cliente exitoso (200 OK con JWT)');
  clientToken = loginCliente.data?.data?.token;
  const clienteToken = loginCliente.data?.data?.token;

  // 4. Verificación de Perfil (/api/auth/me)
  console.log('\n--- 4. Perfil Actual (/api/auth/me) ---');
  const meAdmin = await request('/auth/me', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(meAdmin.status === 200 && meAdmin.data.data.rol === 'administrador', 'GET /auth/me de Administrador retorna rol y datos seguros');
  assert(!meAdmin.data.data.password, 'GET /auth/me nunca expone contraseñas ni hashes');

  // 5. Control de Acceso por Roles (RBAC)
  console.log('\n--- 5. Autorización por Roles (RBAC y 403 Forbidden) ---');
  const clientToRoles = await request('/roles', { headers: { Authorization: `Bearer ${clienteToken}` } });
  assert(clientToRoles.status === 403, 'Cliente intentando acceder a /roles responde 403 Forbidden');

  const supervisorToRoles = await request('/roles', { headers: { Authorization: `Bearer ${supervisorToken}` } });
  assert(supervisorToRoles.status === 403, 'Supervisor intentando acceder a /roles responde 403 Forbidden');

  const supervisorCreateUser = await request('/usuarios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: { nombre: 'Fake', correo: 'fake@fake.com', password: 'Password123*', id_rol: 1 }
  });
  assert(supervisorCreateUser.status === 403, 'Supervisor intentando crear usuario responde 403 Forbidden');

  const clientCreateService = await request('/servicios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clienteToken}` },
    body: { nombre: 'Intento Ilegal', precio: 100 }
  });
  assert(clientCreateService.status === 403, 'Cliente intentando crear servicio responde 403 Forbidden');

  // 6. CRUD Completo: ROLES (Catálogo Protegido)
  console.log('\n--- 6. CRUD: ROLES ---');
  const listRoles = await request('/roles', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(listRoles.status === 200 && listRoles.data.data.length >= 3, 'GET /roles lista los roles del sistema');

  const getRol1 = await request('/roles/1', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(getRol1.status === 200 && getRol1.data.data.nombre === 'administrador', 'GET /roles/1 consulta rol administrador');

  const createExtraRole = await request('/roles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { nombre: 'super_admin_custom', descripcion: 'Rol fuera del catalogo' }
  });
  assert(createExtraRole.status === 409, 'POST /roles bloquea creación de roles fuera del catálogo cerrado (409 Conflict)');

  const deleteCoreRole = await request('/roles/1', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteCoreRole.status === 409, 'DELETE /roles/1 bloquea eliminación de roles estructurales (409 Conflict)');

  // 7. CRUD Completo: CLIENTES
  console.log('\n--- 7. CRUD: CLIENTES ---');
  const createClient = await request('/clientes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      tipo_cliente: 'persona',
      nombre: 'Marcela Beltrán',
      correo: 'marcela.beltran@test.com',
      telefono: '3129876543',
      direccion: 'Calle 50 # 10-30'
    }
  });
  assert(createClient.status === 201 && createClient.data.data.id_cliente, 'POST /clientes crea cliente (201 Created)');
  const newClientId = createClient.data?.data?.id_cliente;
  if (newClientId) testCreatedIds.clients.push(newClientId);

  const getClient = await request(`/clientes/${newClientId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(getClient.status === 200 && getClient.data.data.nombre === 'Marcela Beltrán', 'GET /clientes/:id obtiene cliente creado (200 OK)');

  const updateClient = await request(`/clientes/${newClientId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { nombre: 'Marcela Beltrán de Gomez', direccion: 'Calle 50 # 10-35' }
  });
  assert(updateClient.status === 200 && updateClient.data.data.nombre === 'Marcela Beltrán de Gomez', 'PUT /clientes/:id actualiza cliente (200 OK)');

  const deleteClientWithEvents = await request('/clientes/1', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteClientWithEvents.status === 409, 'DELETE /clientes/1 con eventos asociados responde 409 Conflict');

  const deleteNewClient = await request(`/clientes/${newClientId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteNewClient.status === 200, 'DELETE /clientes/:id sin dependencias responde 200 OK');

  // 8. CRUD Completo: SERVICIOS
  console.log('\n--- 8. CRUD: SERVICIOS ---');
  const createServicio = await request('/servicios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      nombre: 'Cabina de Fotos 360 Spin',
      descripcion: 'Plataforma giratoria con video slow motion',
      precio: 650.00,
      estado: 'activo'
    }
  });
  assert(createServicio.status === 201 && createServicio.data.data.id_servicio, 'POST /servicios crea servicio (201 Created)');
  const newServicioId = createServicio.data?.data?.id_servicio;
  if (newServicioId) testCreatedIds.services.push(newServicioId);

  const getServicio = await request(`/servicios/${newServicioId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(getServicio.status === 200, 'GET /servicios/:id obtiene servicio (200 OK)');

  const updateServicio = await request(`/servicios/${newServicioId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { precio: 700.00, estado: 'inactivo' }
  });
  assert(updateServicio.status === 200 && Number(updateServicio.data.data.precio) === 700, 'PUT /servicios/:id actualiza precio y estado (200 OK)');

  const deleteServicioWithDetails = await request('/servicios/6', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteServicioWithDetails.status === 409, 'DELETE /servicios/6 contratado en eventos responde 409 Conflict');

  const deleteNewServicio = await request(`/servicios/${newServicioId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteNewServicio.status === 200, 'DELETE /servicios/:id sin dependencias responde 200 OK');

  // 9. CRUD Completo: EVENTOS & Claves Foráneas
  console.log('\n--- 9. CRUD: EVENTOS & Validación de Relaciones ---');
  const eventInvalidClient = await request('/eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_cliente: 999999, // Cliente inexistente
      nombre: 'Evento Inexistente',
      tipo_evento: 'Gala',
      fecha_evento: '2026-12-31',
      ubicacion: 'Hotel Tequendama'
    }
  });
  assert(eventInvalidClient.status === 404, 'POST /eventos con cliente inexistente responde 404 Not Found');

  const createEvento = await request('/eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_cliente: 1,
      nombre: 'Lanzamiento Producto NexoCloud',
      tipo_evento: 'Corporativo',
      fecha_evento: '2026-12-20',
      ubicacion: 'Auditorio Empresarial Torre 1',
      estado: 'confirmado'
    }
  });
  assert(createEvento.status === 201 && createEvento.data.data.id_evento, 'POST /eventos crea evento con cliente válido (201 Created)');
  const newEventoId = createEvento.data?.data?.id_evento;
  if (newEventoId) testCreatedIds.events.push(newEventoId);

  const getEvento = await request(`/eventos/${newEventoId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(getEvento.status === 200 && getEvento.data.data.nombre_cliente, 'GET /eventos/:id retorna evento con datos de cliente relacionado');

  const updateEvento = await request(`/eventos/${newEventoId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { ubicacion: 'Auditorio Torre 2 - Salón Principal', estado: 'completado' }
  });
  assert(updateEvento.status === 200 && updateEvento.data.data.estado === 'completado', 'PUT /eventos/:id actualiza ubicación y estado (200 OK)');

  // 10. CRUD Completo: DETALLE_EVENTOS & Precio Unitario Pactado
  console.log('\n--- 10. CRUD: DETALLE_EVENTOS & Integridad ---');
  const detailInvalidService = await request('/detalle-eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_evento: newEventoId,
      id_servicio: 999999, // Servicio inexistente
      cantidad: 2
    }
  });
  assert(detailInvalidService.status === 404, 'POST /detalle-eventos con servicio inexistente responde 404 Not Found');

  const createDetalle = await request('/detalle-eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_evento: newEventoId,
      id_servicio: 3, // Fotografía y Video ($1200)
      cantidad: 2,
      precio_unitario: 1100.00 // Precio especial acordado
    }
  });
  assert(createDetalle.status === 201 && Number(createDetalle.data.data.precio_unitario) === 1100, 'POST /detalle-eventos guarda precio unitario pactado');
  const newDetalleId = createDetalle.data?.data?.id_detalle;
  if (newDetalleId) testCreatedIds.details.push(newDetalleId);

  const getDetalle = await request(`/detalle-eventos/${newDetalleId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(getDetalle.status === 200 && Number(getDetalle.data.data.subtotal) === 2200, 'GET /detalle-eventos/:id calcula subtotal correctamente (2200)');

  const updateDetalle = await request(`/detalle-eventos/${newDetalleId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { cantidad: 3 }
  });
  assert(updateDetalle.status === 200 && Number(updateDetalle.data.data.cantidad) === 3, 'PUT /detalle-eventos/:id actualiza cantidad (200 OK)');

  const deleteEventoWithDetail = await request(`/eventos/${newEventoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteEventoWithDetail.status === 409, 'DELETE /eventos/:id con detalles dependientes responde 409 Conflict');

  const deleteDetalle = await request(`/detalle-eventos/${newDetalleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteDetalle.status === 200, 'DELETE /detalle-eventos/:id elimina detalle (200 OK)');

  const deleteEventoWithoutDetail = await request(`/eventos/${newEventoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteEventoWithoutDetail.status === 200, 'DELETE /eventos/:id ahora que está sin detalles responde 200 OK');

  // 11. CRUD Completo: USUARIOS & Protección del Último Administrador
  console.log('\n--- 11. CRUD: USUARIOS & Reglas de Protección ---');
  const createUser = await request('/usuarios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      nombre: 'Operador Logístico Auxiliar',
      correo: `operador_${Date.now()}@nexoeventos.com`,
      password: 'Password1234*',
      id_rol: 2 // supervisor
    }
  });
  assert(createUser.status === 201 && createUser.data.data.id_usuario, 'POST /usuarios crea usuario administrativamente (201 Created)');
  const newUserId = createUser.data?.data?.id_usuario;
  if (newUserId) testCreatedIds.users.push(newUserId);

  const getUser = await request(`/usuarios/${newUserId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(getUser.status === 200 && !getUser.data.data.password, 'GET /usuarios/:id retorna usuario sin exponer password ni hash');

  const updateUser = await request(`/usuarios/${newUserId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { nombre: 'Operador Logístico Senior' }
  });
  assert(updateUser.status === 200 && updateUser.data.data.nombre === 'Operador Logístico Senior', 'PUT /usuarios/:id actualiza usuario (200 OK)');

  const deleteLastAdmin = await request('/usuarios/1', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteLastAdmin.status === 409, 'DELETE /usuarios/1 bloquea eliminación del único administrador (409 Conflict)');

  const degradeLastAdmin = await request('/usuarios/1', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { id_rol: 2 } // Intento de degradar a supervisor
  });
  assert(degradeLastAdmin.status === 409, 'PUT /usuarios/1 bloquea degradación del único administrador (409 Conflict)');

  const deleteNewUser = await request(`/usuarios/${newUserId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteNewUser.status === 200, 'DELETE /usuarios/:id elimina usuario secundario (200 OK)');

  // 12. Estándar Unificado de Errores & Aislamiento RBAC Estricto (Supervisor 403)
  console.log('\n--- 12. Estándar Unificado de Errores & Control de Privilegios RBAC ---');
  const supervisorUserList = await request('/usuarios', {
    headers: { Authorization: `Bearer ${supervisorToken}` }
  });
  assert(
    supervisorUserList.status === 403 &&
    supervisorUserList.data.success === false &&
    supervisorUserList.data.error?.code === 'FORBIDDEN' &&
    supervisorUserList.data.error?.message === 'No tienes permisos para realizar esta operación.',
    'Supervisor bloqueado con 403 FORBIDDEN en GET /usuarios con estructura de error unificada'
  );

  const supervisorUserDetail = await request('/usuarios/1', {
    headers: { Authorization: `Bearer ${supervisorToken}` }
  });
  assert(
    supervisorUserDetail.status === 403 &&
    supervisorUserDetail.data.error?.code === 'FORBIDDEN',
    'Supervisor bloqueado con 403 FORBIDDEN en GET /usuarios/:id'
  );

  const supervisorUserCreate = await request('/usuarios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: {
      nombre: 'Intento Ilegal',
      correo: 'ilegal@nexoeventos.com',
      password: 'Password123*',
      id_rol: 2
    }
  });
  assert(
    supervisorUserCreate.status === 403 &&
    supervisorUserCreate.data.error?.code === 'FORBIDDEN',
    'Supervisor bloqueado con 403 FORBIDDEN en POST /usuarios'
  );

  // 13. Módulo de Calendario & Gestión de Agendas en Tiempo Real
  console.log('\n--- 13. Módulo de Calendario & Agendas en Tiempo Real ---');

  // 13.1 Categorías y Resumen
  const getCategories = await request('/schedules/categories', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    getCategories.status === 200 && Array.isArray(getCategories.data.data) && getCategories.data.data.length >= 4,
    'GET /schedules/categories retorna al menos las 4 categorías operativas'
  );

  const getSummary = await request('/schedules/summary', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    getSummary.status === 200 && typeof getSummary.data.data.all === 'number',
    'GET /schedules/summary retorna contadores agregados por categoría'
  );

  // 13.2 Vistas Semanal y Diaria
  const getWeek = await request('/schedules/week?date=2026-11-04', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    getWeek.status === 200 &&
    getWeek.data.data.startDate === '2026-11-02' &&
    getWeek.data.data.endDate === '2026-11-08' &&
    Array.isArray(getWeek.data.data.days),
    'GET /schedules/week calcula correctamente el rango de Lunes a Domingo (2026-11-02 a 2026-11-08)',
    JSON.stringify(getWeek.data)
  );

  const getDay = await request('/schedules/day?date=2026-11-06', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    getDay.status === 200 && Array.isArray(getDay.data.data.schedules),
    'GET /schedules/day retorna actividades para la fecha solicitada'
  );

  // 13.3 CRUD de Agenda & Detección de Conflictos de Horario (409)
  const categoryEventId = getCategories.data.data.find(c => c.nombre === 'Event')?.id_categoria || 1;
  const categoryMeetingId = getCategories.data.data.find(c => c.nombre === 'Meeting')?.id_categoria || 2;

  const createSchedule = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: categoryMeetingId,
      titulo: 'Reunión de Coordinación Logística VIP',
      descripcion: 'Alineación técnica de cronograma para gala corporativa.',
      fecha_inicio: '2026-11-09 14:00:00',
      fecha_fin: '2026-11-09 15:30:00',
      id_responsable: 1, // Admin
      ubicacion: 'Sala de Juntas NexoEventos'
    }
  });
  assert(
    createSchedule.status === 201 && createSchedule.data.data.id_agenda,
    'POST /schedules programa nueva actividad de agenda (201 Created)'
  );
  const newScheduleId = createSchedule.data?.data?.id_agenda;
  if (newScheduleId) testCreatedIds.schedules.push(newScheduleId);

  // Prueba de Detección de Conflicto de Intervalo (409 Conflict)
  const createConflictingSchedule = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: categoryMeetingId,
      titulo: 'Reunión en Conflicto de Horario',
      fecha_inicio: '2026-11-09 14:30:00', // Se solapa con 14:00 - 15:30
      fecha_fin: '2026-11-09 16:00:00',
      id_responsable: 1, // Mismo responsable
      ubicacion: 'Sala de Juntas NexoEventos'
    }
  });
  assert(
    createConflictingSchedule.status === 409 &&
    createConflictingSchedule.data.error?.code === 'CONFLICT' &&
    (createConflictingSchedule.data.error?.details?.conflicts || createConflictingSchedule.data.error?.details?.reason),
    'POST /schedules con solapamiento de horario responde 409 CONFLICT con detalles del choque'
  );

  // Reagendamiento mediante Drag & Drop (PATCH /schedules/:id/reschedule)
  const rescheduleOk = await request(`/schedules/${newScheduleId}/reschedule`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      fecha_inicio: '2026-11-09 16:00:00',
      fecha_fin: '2026-11-09 17:30:00'
    }
  });
  assert(
    rescheduleOk.status === 200 && rescheduleOk.data?.data?.fecha_inicio?.includes('16:00'),
    'PATCH /schedules/:id/reschedule reagenda la actividad a un horario libre (200 OK)',
    JSON.stringify(rescheduleOk.data)
  );

  // 13.4 Notas Operativas & Asignación de Equipo
  const addNote = await request(`/schedules/${newScheduleId}/notes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { descripcion: 'Verificar checklist de audio y micrófonos inalámbricos' }
  });
  assert(
    addNote.status === 201 && addNote.data.data.id_nota,
    'POST /schedules/:id/notes agrega nota operativa (201 Created)'
  );
  const newNoteId = addNote.data?.data?.id_nota;

  const toggleNote = await request(`/schedules/notes/${newNoteId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { completada: true }
  });
  assert(
    toggleNote.status === 200 && (toggleNote.data.data.completada === 1 || toggleNote.data.data.completada === true),
    'PATCH /schedules/notes/:idNota marca la tarea como completada (200 OK)'
  );

  const addTeamMember = await request(`/schedules/${newScheduleId}/team`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { id_usuario: 2 } // Supervisor
  });
  assert(
    addTeamMember.status === 201,
    'POST /schedules/:id/team asigna integrante del personal (201 Created)'
  );

  const removeTeamMember = await request(`/schedules/${newScheduleId}/team/2`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    removeTeamMember.status === 200,
    'DELETE /schedules/:id/team/:userId remueve integrante del personal (200 OK)'
  );

  const deleteNote = await request(`/schedules/notes/${newNoteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    deleteNote.status === 200,
    'DELETE /schedules/notes/:idNota elimina la nota operativa (200 OK)'
  );

  // 13.5 Exportación iCalendar RFC 5545 (.ICS)
  const icsResponse = await fetch(`${BASE_URL}/schedules/export/ics`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const icsText = await icsResponse.text();
  assert(
    icsResponse.status === 200 &&
    icsResponse.headers.get('content-type')?.includes('text/calendar') &&
    icsText.includes('BEGIN:VCALENDAR') &&
    icsText.includes('PRODID:-//NexoEventos//') &&
    icsText.includes('END:VCALENDAR'),
    'GET /schedules/export/ics genera archivo iCalendar estándar RFC 5545 válido'
  );

  // 13.6 Aislamiento de Privacidad para Rol Cliente
  const clientSchedules = await request('/schedules', {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert(
    clientSchedules.status === 200 &&
    Array.isArray(clientSchedules.data.data) &&
    clientSchedules.data.data.every(s => s.categoria_nombre === 'Event'),
    'Rol Cliente únicamente visualiza actividades de categoría Event asociadas a sus eventos'
  );

  // Limpieza de la agenda de prueba
  const deleteSchedule = await request(`/schedules/${newScheduleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    deleteSchedule.status === 200,
    'DELETE /schedules/:id elimina actividad de prueba (200 OK)'
  );

  // =========================================================================
  // 14. Integridad Comercial y Protección contra Agendas Duplicadas
  // =========================================================================
  console.log('\n--- 14. Integridad Comercial y Regla de Agenda Principal Única ---');

  // 14.1 Propiedad tiene_agenda_principal en GET /eventos
  const eventosListRes = await request('/eventos', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const eventHasFlag = Array.isArray(eventosListRes.data.data) && eventosListRes.data.data.some(e => 'tiene_agenda_principal' in e);
  assert(eventHasFlag, 'GET /eventos retorna la propiedad tiene_agenda_principal para discriminar en selectores');

  // Crear evento comercial de prueba en estado pendiente
  const eventPendingRes = await request('/eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_cliente: 1,
      nombre: 'Lanzamiento Startup Nexo Alpha',
      tipo_evento: 'Corporativo',
      fecha_evento: '2026-11-25',
      ubicacion: 'Auditorio Tech Central',
      estado: 'pendiente'
    }
  });
  const pendingEventId = eventPendingRes.data.data.id_evento;
  if (pendingEventId) testCreatedIds.events.push(pendingEventId);

  // 14.2 Bloqueo de agenda sobre evento pendiente
  const scheduleOnPending = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 1,
      id_evento: pendingEventId,
      id_responsable: 1,
      titulo: 'Actividad sobre evento pendiente',
      fecha_inicio: '2026-11-25 09:00:00',
      fecha_fin: '2026-11-25 12:00:00',
      ubicacion: 'Auditorio Tech Central'
    }
  });
  assert(scheduleOnPending.status === 400, 'POST /schedules bloquea calendarización de evento en estado pendiente (400 Bad Request)');

  // 14.3 Bloqueo de agenda sobre evento cancelado
  await request(`/eventos/${pendingEventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { estado: 'cancelado' }
  });
  const scheduleOnCancelled = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 1,
      id_evento: pendingEventId,
      id_responsable: 1,
      titulo: 'Actividad sobre evento cancelado',
      fecha_inicio: '2026-11-25 09:00:00',
      fecha_fin: '2026-11-25 12:00:00',
      ubicacion: 'Auditorio Tech Central'
    }
  });
  assert(scheduleOnCancelled.status === 400, 'POST /schedules bloquea calendarización de evento en estado cancelado (400 Bad Request)');

  // Aprobar el evento para dejarlo en estado confirmado
  await request(`/eventos/${pendingEventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { estado: 'confirmado' }
  });

  // 14.4 Creación exitosa de la Agenda Principal (categoría Event, id_categoria = 1)
  const mainScheduleRes = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 1,
      id_evento: pendingEventId,
      id_responsable: 1,
      titulo: 'Lanzamiento Startup Nexo Alpha — Ceremonia Principal',
      fecha_inicio: '2026-11-25 09:00:00',
      fecha_fin: '2026-11-25 12:00:00',
      ubicacion: 'Auditorio Tech Central'
    }
  });
  const mainScheduleId = mainScheduleRes.data.data?.id_agenda;
  if (mainScheduleId) testCreatedIds.schedules.push(mainScheduleId);
  assert(mainScheduleRes.status === 201 && mainScheduleId, 'POST /schedules crea agenda principal para evento confirmado (201 Created)');

  // 14.5 Bloqueo estricto de duplicación de Agenda Principal (HTTP 409 Conflict)
  const duplicateMainScheduleRes = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 1,
      id_evento: pendingEventId,
      id_responsable: 2,
      titulo: 'Intento de segunda agenda principal para el mismo evento',
      fecha_inicio: '2026-11-25 14:00:00',
      fecha_fin: '2026-11-25 17:00:00',
      ubicacion: 'Auditorio Tech Central'
    }
  });
  assert(
    duplicateMainScheduleRes.status === 409 && duplicateMainScheduleRes.data.error?.code === 'CONFLICT',
    'POST /schedules bloquea intento de duplicar agenda principal respondiendo 409 CONFLICT'
  );

  // 14.6 Múltiples actividades operativas secundarias permitidas para el mismo evento (Reuniones / Montajes)
  const secondaryActivityRes = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 2, // Meeting
      id_evento: pendingEventId,
      id_responsable: 2,
      titulo: 'Reunión de Coordinación Logística para Lanzamiento Alpha',
      fecha_inicio: '2026-11-24 10:00:00',
      fecha_fin: '2026-11-24 11:30:00',
      ubicacion: 'Sala de Juntas B'
    }
  });
  const secondaryActivityId = secondaryActivityRes.data.data?.id_agenda;
  if (secondaryActivityId) testCreatedIds.schedules.push(secondaryActivityId);
  assert(secondaryActivityRes.status === 201 && secondaryActivityId, 'POST /schedules permite múltiples actividades operativas (Meeting) para el mismo evento (201 Created)');

  // 14.7 Simulación de concurrencia: solicitudes simultáneas para programar agenda principal
  const eventConcurrent = await request('/eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_cliente: 1,
      nombre: 'Evento Prueba de Concurrencia Nexo',
      tipo_evento: 'Corporativo',
      fecha_evento: '2026-11-27',
      ubicacion: 'Salón Concurrente',
      estado: 'confirmado'
    }
  });
  const concEventId = eventConcurrent.data.data?.id_evento;
  if (concEventId) testCreatedIds.events.push(concEventId);

  // Lanzar dos peticiones en paralelo para la misma agenda principal
  const [conc1, conc2] = await Promise.all([
    request('/schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id_categoria: 1,
        id_evento: concEventId,
        id_responsable: 1,
        titulo: 'Agenda Concurrente A',
        fecha_inicio: '2026-11-27 08:00:00',
        fecha_fin: '2026-11-27 10:00:00',
        ubicacion: 'Salón Concurrente'
      }
    }),
    request('/schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id_categoria: 1,
        id_evento: concEventId,
        id_responsable: 2,
        titulo: 'Agenda Concurrente B',
        fecha_inicio: '2026-11-27 11:00:00',
        fecha_fin: '2026-11-27 13:00:00',
        ubicacion: 'Salón Concurrente'
      }
    })
  ]);

  const hasOneSuccess = (conc1.status === 201 && conc2.status === 409) || (conc2.status === 201 && conc1.status === 409);
  assert(hasOneSuccess, 'Condición de carrera resuelta: de dos solicitudes simultáneas, una es 201 y la otra 409 Conflict');

  const createdConcScheduleId = conc1.status === 201 ? conc1.data.data?.id_agenda : conc2.data.data?.id_agenda;
  if (createdConcScheduleId) testCreatedIds.schedules.push(createdConcScheduleId);

  // Limpieza de agendas y eventos de prueba de la sección 14
  if (mainScheduleId) await request(`/schedules/${mainScheduleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  if (secondaryActivityId) await request(`/schedules/${secondaryActivityId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  if (createdConcScheduleId) await request(`/schedules/${createdConcScheduleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  if (pendingEventId) await request(`/eventos/${pendingEventId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  if (concEventId) await request(`/eventos/${concEventId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });

  // =========================================================================
  // 15. Auditoría de Seguridad, Roles y Sincronización en Tiempo Real
  // =========================================================================
  console.log('\n--- 15. Seguridad, Aislamiento de Roles y Sincronización en Tiempo Real ---');

  // 15.1 Acceso administrativo total a usuarios y roles
  const adminUsersList = await request('/usuarios', { headers: { Authorization: `Bearer ${adminToken}` } });
  const adminRolesList = await request('/roles', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(adminUsersList.status === 200 && adminRolesList.status === 200, 'Administrador accede con 200 OK a /usuarios y /roles');

  // 15.2 Bloqueo de rutas administrativas al Supervisor
  const supRolesBlocked = await request('/roles', { headers: { Authorization: `Bearer ${supervisorToken}` } });
  assert(supRolesBlocked.status === 403 && supRolesBlocked.data.error?.code === 'FORBIDDEN', 'Supervisor bloqueado con 403 FORBIDDEN en /roles');

  // 15.3 Aislamiento de eventos entre clientes
  // Cliente 1 (id_cliente = 1) intenta acceder a Evento 2 (propiedad de Cliente 2: 'Boda Real Carolina y Fernando')
  const clientViewOtherEvent = await request('/eventos/2', { headers: { Authorization: `Bearer ${clientToken}` } });
  assert(
    clientViewOtherEvent.status === 403 && clientViewOtherEvent.data?.error?.code === 'FORBIDDEN',
    'Cliente restringido de acceder a información de eventos ajenos (GET /eventos/2 responde 403 FORBIDDEN)'
  );

  // 15.4 Aislamiento de datos de otros clientes
  const clientViewOtherClient = await request('/clientes/2', { headers: { Authorization: `Bearer ${clientToken}` } });
  assert(clientViewOtherClient.status === 403, 'Cliente bloqueado con 403 FORBIDDEN al consultar perfil de otro cliente');

  // 15.5 Rechazo de token con firma adulterada
  const tamperedTokenRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}TAMPERED` }
  });
  assert(tamperedTokenRes.status === 401 && tamperedTokenRes.data.error?.code === 'INVALID_TOKEN', 'Token con firma adulterada responde 401 INVALID_TOKEN');

  // 15.6 Respuestas de error sin exposición de stack traces ni consultas SQL
  const errNoLeak = duplicateMainScheduleRes.data;
  const leaksDetails = JSON.stringify(errNoLeak).toLowerCase().includes('stack') ||
                       JSON.stringify(errNoLeak).includes('SELECT ') ||
                       JSON.stringify(errNoLeak).includes('C:\\Users');
  assert(!leaksDetails, 'Respuestas de error unificadas no exponen stack traces, rutas locales ni consultas SQL');

  // 15.7 Sincronización en tiempo real vía Socket.IO
  const socketHandshakeRes = await fetch(`http://localhost:${process.env.PORT || 5000}/socket.io/?EIO=4&transport=polling`);
  const socketHandshakeText = await socketHandshakeRes.text();
  assert(
    socketHandshakeRes.status === 200 && socketHandshakeText.includes('sid'),
    'Servidor Socket.IO responde exitosamente al handshake en tiempo real (sid activo)'
  );

  } catch (uncaughtErr) {
    console.error('\n[ERROR NO CONTROLADO EN PRUEBAS]', uncaughtErr);
    failedTests++;
  } finally {
    console.log('\n--- 16. Limpieza Automática y Segura de Registros Creados (finally) ---');
    try {
      // 1. Eliminar agendas creadas por esta ejecución
      for (const idAg of testCreatedIds.schedules) {
        try {
          if (adminToken) await request(`/schedules/${idAg}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        } catch (_) {}
      }

      // 2. Eliminar detalles de eventos creados por esta ejecución
      for (const idDet of testCreatedIds.details) {
        try {
          if (adminToken) await request(`/detalle-eventos/${idDet}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        } catch (_) {}
      }

      // 3. Eliminar eventos creados por esta ejecución
      for (const idEv of testCreatedIds.events) {
        try {
          if (adminToken) await request(`/eventos/${idEv}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        } catch (_) {}
      }

      // 4. Eliminar servicios creados por esta ejecución
      for (const idServ of testCreatedIds.services) {
        try {
          if (adminToken) await request(`/servicios/${idServ}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        } catch (_) {}
      }

      // 5. Eliminar usuarios creados por esta ejecución (incluye el cliente registrado en Sec. 3)
      for (const idUsr of testCreatedIds.users) {
        try {
          if (adminToken) await request(`/usuarios/${idUsr}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        } catch (_) {}
      }

      // 6. Eliminar clientes creados por esta ejecución (incluye el perfil cliente registrado en Sec. 3)
      for (const idCli of testCreatedIds.clients) {
        try {
          if (adminToken) await request(`/clientes/${idCli}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
        } catch (_) {}
      }

      // 7. Respaldo directo en MySQL: si quedó algún registro por fallo de HTTP antes de tokens
      if (testCreatedIds.schedules.length > 0) {
        await pool.query('DELETE FROM agendas WHERE id_agenda IN (?)', [testCreatedIds.schedules]);
      }
      if (testCreatedIds.details.length > 0) {
        await pool.query('DELETE FROM detalle_eventos WHERE id_detalle IN (?)', [testCreatedIds.details]);
      }
      if (testCreatedIds.events.length > 0) {
        await pool.query('DELETE FROM eventos WHERE id_evento IN (?)', [testCreatedIds.events]);
      }
      if (testCreatedIds.services.length > 0) {
        await pool.query('DELETE FROM servicios WHERE id_servicio IN (?)', [testCreatedIds.services]);
      }
      if (testCreatedIds.users.length > 0) {
        await pool.query('DELETE FROM usuarios WHERE id_usuario IN (?)', [testCreatedIds.users]);
      }
      if (testCreatedIds.clients.length > 0) {
        await pool.query('DELETE FROM clientes WHERE id_cliente IN (?)', [testCreatedIds.clients]);
      }

      // 8. Verificación directa en MySQL de que NO quede ningún registro creado por esta ejecución
      const [residualUsers] = testCreatedIds.users.length > 0
        ? await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario IN (?)', [testCreatedIds.users])
        : [[]];
      const [residualClients] = testCreatedIds.clients.length > 0
        ? await pool.query('SELECT id_cliente FROM clientes WHERE id_cliente IN (?)', [testCreatedIds.clients])
        : [[]];
      const [residualEvents] = testCreatedIds.events.length > 0
        ? await pool.query('SELECT id_evento FROM eventos WHERE id_evento IN (?)', [testCreatedIds.events])
        : [[]];
      const [residualSchedules] = testCreatedIds.schedules.length > 0
        ? await pool.query('SELECT id_agenda FROM agendas WHERE id_agenda IN (?)', [testCreatedIds.schedules])
        : [[]];
      const [residualServices] = testCreatedIds.services.length > 0
        ? await pool.query('SELECT id_servicio FROM servicios WHERE id_servicio IN (?)', [testCreatedIds.services])
        : [[]];

      const totalResiduales = residualUsers.length + residualClients.length + residualEvents.length + residualSchedules.length + residualServices.length;
      assert(totalResiduales === 0, 'Verificación directa en MySQL: 0 registros residuales creados por esta suite');

    } catch (cleanupErr) {
      console.error('Error durante la verificación de limpieza:', cleanupErr);
      failedTests++;
    } finally {
      await pool.end();
    }
  }

  console.log('\n======================================================');
  console.log(`[RESUMEN] RESULTADO DE LA SUITE DE PRUEBAS:`);
  console.log(`   Pruebas Exitosas: ${passedTests}`);
  console.log(`   Pruebas Fallidas: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();

