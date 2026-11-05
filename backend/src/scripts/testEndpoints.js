import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message} - ${details}`);
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
  console.log('🧪 SUITE DE PRUEBAS AUTOMATIZADAS - API NEXOEVENTOS');
  console.log(`📡 URL Objetivo: ${BASE_URL}`);
  console.log('======================================================\n');

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
  const adminToken = loginAdmin.data?.data?.token;

  const loginSupervisor = await request('/auth/login', {
    method: 'POST',
    body: {
      correo: 'supervisor@nexoeventos.com',
      password: 'Supervisor1234*'
    }
  });
  assert(loginSupervisor.status === 200 && loginSupervisor.data.data.token, 'Login Supervisor exitoso (200 OK con JWT)');
  const supervisorToken = loginSupervisor.data?.data?.token;

  const loginCliente = await request('/auth/login', {
    method: 'POST',
    body: {
      correo: 'cliente@empresa.com',
      password: 'Cliente1234*'
    }
  });
  assert(loginCliente.status === 200 && loginCliente.data.data.token, 'Login Cliente exitoso (200 OK con JWT)');
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

  console.log('\n======================================================');
  console.log(`📊 RESULTADO DE LA SUITE DE PRUEBAS:`);
  console.log(`   Pruebas Exitosas: ${passedTests}`);
  console.log(`   Pruebas Fallidas: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();

