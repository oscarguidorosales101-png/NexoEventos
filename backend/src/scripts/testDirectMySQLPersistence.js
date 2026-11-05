import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

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

function assert(condition, message, detail = '') {
  if (!condition) {
    console.error(`  [FAIL] ${message}${detail ? ' - ' + detail : ''}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPersistenceSuite() {
  console.log('================================================================');
  console.log('[SUITE] PRUEBAS DE PERSISTENCIA REAL EN MYSQL 8.0 — 10 ENTIDADES');
  console.log('================================================================\n');

  // Limpieza previa preventiva en orden estricto de claves foráneas
  await pool.query("DELETE FROM agenda_notas WHERE id_agenda IN (SELECT id_agenda FROM agendas WHERE titulo LIKE '%Robótica%' OR titulo LIKE '%Expositores%')");
  await pool.query("DELETE FROM agenda_integrantes WHERE id_agenda IN (SELECT id_agenda FROM agendas WHERE titulo LIKE '%Robótica%' OR titulo LIKE '%Expositores%')");
  await pool.query("DELETE FROM agendas WHERE titulo LIKE '%Robótica%' OR titulo LIKE '%Expositores%'");
  await pool.query("DELETE FROM detalle_eventos WHERE id_evento IN (SELECT id_evento FROM eventos WHERE nombre LIKE '%Robótica%')");
  await pool.query("DELETE FROM eventos WHERE nombre LIKE '%Robótica%'");
  await pool.query("DELETE FROM clientes WHERE nombre LIKE '%Alpha Dynamics%'");
  await pool.query("DELETE FROM usuarios WHERE correo LIKE '%carlos.logistica%'");
  await pool.query("DELETE FROM servicios WHERE nombre LIKE '%Láseres%'");

  // Autenticación de los 3 roles
  const loginAdmin = await request('/auth/login', {
    method: 'POST',
    body: { correo: 'admin@nexoeventos.com', password: 'Admin1234*' }
  });
  assert(loginAdmin.status === 200 && loginAdmin.data.data.token, 'Login de Administrador exitoso');
  const adminToken = loginAdmin.data.data.token;

  const loginSupervisor = await request('/auth/login', {
    method: 'POST',
    body: { correo: 'supervisor@nexoeventos.com', password: 'Supervisor1234*' }
  });
  assert(loginSupervisor.status === 200 && loginSupervisor.data.data.token, 'Login de Supervisor exitoso');
  const supervisorToken = loginSupervisor.data.data.token;

  const loginCliente = await request('/auth/login', {
    method: 'POST',
    body: { correo: 'cliente@empresa.com', password: 'Cliente1234*' }
  });
  assert(loginCliente.status === 200 && loginCliente.data.data.token, 'Login de Cliente exitoso');
  const clienteToken = loginCliente.data.data.token;

  // =========================================================================
  // 1. ENTIDAD: ROLES (Catálogo cerrado y persistencia)
  // =========================================================================
  console.log('\n--- 1. ENTIDAD: ROLES ---');
  const [rolesDb] = await pool.query('SELECT * FROM roles ORDER BY id_rol ASC');
  assert(rolesDb.length === 3, 'MySQL contiene los 3 roles estructurales');

  const rolesApi = await request('/roles', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(rolesApi.status === 200 && rolesApi.data.data.length === 3, 'GET /roles retorna 3 roles coincidentes con MySQL');

  // Bloqueo de rol arbitrario
  const badRoleRes = await request('/roles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { nombre: 'hacker_role', descripcion: 'Invalido' }
  });
  assert(badRoleRes.status === 409, 'POST /roles bloquea inserción de rol no admitido (409 Conflict)');

  // Actualizar descripción de rol
  const updateRol = await request('/roles/2', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { descripcion: 'Supervisor de logística y cronogramas operativos' }
  });
  assert(updateRol.status === 200, 'PUT /roles/2 actualiza descripción de rol (200 OK)');
  const [rolUpdatedInDb] = await pool.query('SELECT descripcion FROM roles WHERE id_rol = 2');
  assert(rolUpdatedInDb[0].descripcion.includes('logística'), 'MySQL refleja la nueva descripción del rol');

  // =========================================================================
  // 2. ENTIDAD: CLIENTES
  // =========================================================================
  console.log('\n--- 2. ENTIDAD: CLIENTES ---');
  const clientUnique = Date.now();
  const newClientRes = await request('/clientes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      tipo_cliente: 'empresa',
      nombre: `Alpha Dynamics Tech Inc. ${clientUnique}`,
      correo: `contact.${clientUnique}@alphadynamics.io`,
      telefono: '506-8888-9999',
      direccion: 'Parque Tecnológico Oficentro Torre B'
    }
  });
  assert(newClientRes.status === 201, 'POST /clientes crea nuevo cliente comercial (201 Created)');
  const idCliente = newClientRes.data.data.id_cliente;

  // Verificación directa en MySQL
  const [clientDb] = await pool.query('SELECT * FROM clientes WHERE id_cliente = ?', [idCliente]);
  assert(clientDb.length === 1 && clientDb[0].nombre.includes('Alpha Dynamics'), 'MySQL almacena el cliente con sus campos intactos');

  // Modificación y comprobación
  const updateClientRes = await request(`/clientes/${idCliente}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { direccion: 'Edificio Platinum Piso 4' }
  });
  assert(updateClientRes.status === 200, 'PUT /clientes/:id actualiza dirección (200 OK)');
  const [clientDbAfterUpdate] = await pool.query('SELECT direccion FROM clientes WHERE id_cliente = ?', [idCliente]);
  assert(clientDbAfterUpdate[0].direccion === 'Edificio Platinum Piso 4', 'MySQL refleja la dirección actualizada');

  // =========================================================================
  // 3. ENTIDAD: USUARIOS
  // =========================================================================
  console.log('\n--- 3. ENTIDAD: USUARIOS ---');
  const userUnique = Date.now();
  const newUserRes = await request('/usuarios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      nombre: 'Ingeniero Logística Carlos',
      correo: `carlos.logistica.${userUnique}@nexoeventos.com`,
      password: 'Password1234*',
      id_rol: 2 // Supervisor
    }
  });
  assert(newUserRes.status === 201, 'POST /usuarios crea usuario de personal (201 Created)');
  const idUsuario = newUserRes.data.data.id_usuario;

  // Verificación en MySQL de hash bcrypt y ocultamiento en API
  assert(newUserRes.data.data.password === undefined, 'Respuesta API no expone contraseña');
  const [userDb] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [idUsuario]);
  assert(userDb.length === 1 && userDb[0].password.startsWith('$2'), 'MySQL almacena la contraseña hasheada con bcrypt');

  // Actualización de usuario
  const updateUserRes = await request(`/usuarios/${idUsuario}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { nombre: 'Ingeniero Logística Carlos Senior' }
  });
  assert(updateUserRes.status === 200, 'PUT /usuarios/:id actualiza nombre del usuario (200 OK)');
  const [userDbUpdated] = await pool.query('SELECT nombre FROM usuarios WHERE id_usuario = ?', [idUsuario]);
  assert(userDbUpdated[0].nombre === 'Ingeniero Logística Carlos Senior', 'MySQL refleja el nuevo nombre del usuario');

  // =========================================================================
  // 4. ENTIDAD: SERVICIOS
  // =========================================================================
  console.log('\n--- 4. ENTIDAD: SERVICIOS ---');
  const newServiceRes = await request('/servicios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      nombre: 'Show de Láseres y Efectos Especiales',
      descripcion: 'Luces robóticas, pirotecnia fría y visuales sincronizados.',
      precio: 1450.00,
      estado: 'activo'
    }
  });
  assert(newServiceRes.status === 201, 'POST /servicios crea servicio comercial (201 Created)');
  const idServicio = newServiceRes.data.data.id_servicio;

  const [serviceDb] = await pool.query('SELECT * FROM servicios WHERE id_servicio = ?', [idServicio]);
  assert(serviceDb.length === 1 && Number(serviceDb[0].precio) === 1450.00, 'MySQL almacena el precio y descripción del servicio');

  // Actualizar precio
  const updateServiceRes = await request(`/servicios/${idServicio}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { precio: 1550.00, estado: 'activo' }
  });
  assert(updateServiceRes.status === 200, 'PUT /servicios/:id actualiza precio unitario (200 OK)');
  const [serviceDbUpdated] = await pool.query('SELECT precio FROM servicios WHERE id_servicio = ?', [idServicio]);
  assert(Number(serviceDbUpdated[0].precio) === 1550.00, 'MySQL refleja el nuevo precio (1550.00)');

  // =========================================================================
  // 5. ENTIDAD: EVENTOS
  // =========================================================================
  console.log('\n--- 5. ENTIDAD: EVENTOS ---');
  const newEventRes = await request('/eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_cliente: idCliente,
      nombre: 'Convención Internacional de Robótica 2026',
      tipo_evento: 'Corporativo',
      fecha_evento: '2026-12-15',
      ubicacion: 'Centro de Convenciones Metropolitano Hall A',
      estado: 'confirmado'
    }
  });
  assert(newEventRes.status === 201, 'POST /eventos registra nuevo evento comercial (201 Created)');
  const idEvento = newEventRes.data.data.id_evento;

  const [eventDb] = await pool.query('SELECT * FROM eventos WHERE id_evento = ?', [idEvento]);
  assert(eventDb.length === 1 && eventDb[0].nombre.includes('Robótica'), 'MySQL almacena el evento vinculado al cliente');

  // Actualizar ubicación
  const updateEventRes = await request(`/eventos/${idEvento}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { ubicacion: 'Centro de Convenciones Metropolitano Pabellón Diamante' }
  });
  assert(updateEventRes.status === 200, 'PUT /eventos/:id actualiza ubicación (200 OK)');
  const [eventDbUpdated] = await pool.query('SELECT ubicacion FROM eventos WHERE id_evento = ?', [idEvento]);
  assert(eventDbUpdated[0].ubicacion.includes('Pabellón Diamante'), 'MySQL refleja la nueva locación del evento');

  // =========================================================================
  // 6. ENTIDAD: DETALLE_EVENTOS
  // =========================================================================
  console.log('\n--- 6. ENTIDAD: DETALLE_EVENTOS ---');
  const newDetailRes = await request('/detalle-eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_evento: idEvento,
      id_servicio: idServicio,
      cantidad: 2,
      precio_unitario: 1550.00
    }
  });
  assert(newDetailRes.status === 201, 'POST /detalle-eventos contrata servicio en el evento (201 Created)');
  const idDetalle = newDetailRes.data.data.id_detalle;

  // Verificación en MySQL de persistencia y cálculo de subtotal (2 * 1550 = 3100)
  const [detailDb] = await pool.query('SELECT * FROM detalle_eventos WHERE id_detalle = ?', [idDetalle]);
  assert(detailDb.length === 1 && detailDb[0].cantidad === 2 && Number(detailDb[0].precio_unitario) === 1550.00, 'MySQL almacena el detalle pactado');

  const getEventWithBudget = await request(`/eventos/${idEvento}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(Number(getEventWithBudget.data.data.total_presupuesto) === 3100.00, 'Cálculo de subtotal y presupuesto total refleja 3100.00');

  // Protección: Intentar eliminar evento con detalles dependientes
  const deleteEventBlocked = await request(`/eventos/${idEvento}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteEventBlocked.status === 409, 'DELETE /eventos/:id bloquea eliminación ante detalles dependientes (409 Conflict)');

  // =========================================================================
  // 7. ENTIDAD: CATEGORIAS_AGENDA
  // =========================================================================
  console.log('\n--- 7. ENTIDAD: CATEGORIAS_AGENDA ---');
  const [catsDb] = await pool.query('SELECT * FROM categorias_agenda ORDER BY id_categoria ASC');
  const catsApi = await request('/schedules/categories', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(catsApi.status === 200 && catsApi.data.data.length === catsDb.length, 'GET /schedules/categories coincide exactamente con filas de MySQL');

  // =========================================================================
  // 8. ENTIDAD: AGENDAS
  // =========================================================================
  console.log('\n--- 8. ENTIDAD: AGENDAS ---');
  // 8.1 Crear Agenda Principal (id_categoria = 1) vinculada al evento
  const newScheduleRes = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 1, // Event
      id_evento: idEvento,
      id_responsable: idUsuario,
      titulo: 'Gran Gala Inaugural Convención de Robótica',
      descripcion: 'Apertura de pabellones, acreditación VIP y cena ejecutiva.',
      fecha_inicio: '2026-12-15 18:00:00',
      fecha_fin: '2026-12-15 22:00:00',
      ubicacion: 'Centro de Convenciones Metropolitano Pabellón Diamante',
      teamUserIds: [idUsuario]
    }
  });
  assert(newScheduleRes.status === 201, 'POST /schedules crea agenda principal para evento (201 Created)');
  const idAgenda = newScheduleRes.data.data.id_agenda;

  // Verificación en MySQL
  const [agendaDb] = await pool.query('SELECT * FROM agendas WHERE id_agenda = ?', [idAgenda]);
  assert(agendaDb.length === 1 && agendaDb[0].id_evento === idEvento && agendaDb[0].id_categoria === 1, 'MySQL persiste la agenda principal');

  // 8.2 Bloqueo de duplicado de agenda principal en el mismo evento (409 Conflict)
  const dupScheduleRes = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 1, // Event
      id_evento: idEvento,
      id_responsable: 1, // Admin
      titulo: 'Segunda agenda principal redundante',
      fecha_inicio: '2026-12-15 10:00:00',
      fecha_fin: '2026-12-15 12:00:00',
      ubicacion: 'Lobby'
    }
  });
  assert(dupScheduleRes.status === 409, 'POST /schedules bloquea duplicación de agenda principal respondiendo 409 CONFLICT');
  const [agendasCountDb] = await pool.query('SELECT COUNT(*) AS total FROM agendas WHERE id_evento = ? AND id_categoria = 1', [idEvento]);
  assert(agendasCountDb[0].total === 1, 'MySQL garantiza que existe exactamente 1 agenda principal para el evento');

  // 8.3 Permitir actividad operativa secundaria para el mismo evento (Reunión id_categoria = 2)
  const secondaryScheduleRes = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      id_categoria: 2, // Meeting
      id_evento: idEvento,
      id_responsable: 1, // Admin (horario diferente)
      titulo: 'Reunión de Coordinación Previa con Expositores',
      fecha_inicio: '2026-12-14 14:00:00',
      fecha_fin: '2026-12-14 15:30:00',
      ubicacion: 'Sala de Conferencias B'
    }
  });
  assert(secondaryScheduleRes.status === 201, 'POST /schedules permite actividad secundaria (Meeting) para el mismo evento', JSON.stringify(secondaryScheduleRes.data));
  const idAgendaSecundaria = secondaryScheduleRes.data.data.id_agenda;

  // 8.4 Drag & Drop / Reagendamiento
  const rescheduleRes = await request(`/schedules/${idAgendaSecundaria}/reschedule`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      fecha_inicio: '2026-12-14 16:00:00',
      fecha_fin: '2026-12-14 17:30:00'
    }
  });
  assert(rescheduleRes.status === 200, 'PATCH /schedules/:id/reschedule reagenda la actividad (200 OK)', JSON.stringify(rescheduleRes.data));
  const [agendaSecDb] = await pool.query('SELECT fecha_inicio FROM agendas WHERE id_agenda = ?', [idAgendaSecundaria]);
  assert(String(agendaSecDb[0].fecha_inicio).includes('16:00'), 'MySQL persiste el nuevo horario reagendado');

  // =========================================================================
  // 9. ENTIDAD: AGENDA_INTEGRANTES
  // =========================================================================
  console.log('\n--- 9. ENTIDAD: AGENDA_INTEGRANTES ---');
  // Asignar supervisor a la agenda principal
  const addTeamMemberRes = await request(`/schedules/${idAgenda}/team`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { id_usuario: 2 } // Supervisor existente
  });
  assert(addTeamMemberRes.status === 201, 'POST /schedules/:id/team asigna integrante del personal (201 Created)');
  const [memberDb] = await pool.query('SELECT * FROM agenda_integrantes WHERE id_agenda = ? AND id_usuario = 2', [idAgenda]);
  assert(memberDb.length === 1, 'MySQL persiste el integrante en la tabla agenda_integrantes');

  // Remover integrante
  const removeMemberRes = await request(`/schedules/${idAgenda}/team/2`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(removeMemberRes.status === 200, 'DELETE /schedules/:id/team/:userId remueve integrante (200 OK)');
  const [memberDbAfter] = await pool.query('SELECT * FROM agenda_integrantes WHERE id_agenda = ? AND id_usuario = 2', [idAgenda]);
  assert(memberDbAfter.length === 0, 'MySQL confirma que el integrante fue eliminado de la tabla');

  // =========================================================================
  // 10. ENTIDAD: AGENDA_NOTAS
  // =========================================================================
  console.log('\n--- 10. ENTIDAD: AGENDA_NOTAS ---');
  const addNoteRes = await request(`/schedules/${idAgenda}/notes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { descripcion: 'Confirmar acreditaciones y gafetes VIP con seguridad privada' }
  });
  assert(addNoteRes.status === 201, 'POST /schedules/:id/notes crea nota operativa (201 Created)');
  const idNota = addNoteRes.data.data.id_nota;

  const [noteDb] = await pool.query('SELECT * FROM agenda_notas WHERE id_nota = ?', [idNota]);
  assert(noteDb.length === 1 && noteDb[0].completada === 0, 'MySQL almacena la nota en estado pendiente (0)');

  // Marcar como completada
  const toggleNoteRes = await request(`/schedules/notes/${idNota}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { completada: true }
  });
  assert(toggleNoteRes.status === 200, 'PATCH /schedules/notes/:id actualiza estado de completado (200 OK)');
  const [noteDbUpdated] = await pool.query('SELECT completada FROM agenda_notas WHERE id_nota = ?', [idNota]);
  assert(noteDbUpdated[0].completada === 1, 'MySQL confirma que la nota figura como completada (1)');

  // Eliminar nota
  const deleteNoteRes = await request(`/schedules/notes/${idNota}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(deleteNoteRes.status === 200, 'DELETE /schedules/notes/:id elimina la nota operativa (200 OK)');
  const [noteDbDeleted] = await pool.query('SELECT * FROM agenda_notas WHERE id_nota = ?', [idNota]);
  assert(noteDbDeleted.length === 0, 'MySQL confirma que la nota fue eliminada físicamente');

  // =========================================================================
  // LIMPIEZA RIGUROSA Y COMPROBACIÓN DE ELIMINACIÓN EN MYSQL
  // =========================================================================
  console.log('\n--- LIMPIEZA COMPLETA DE REGISTROS DE PRUEBA Y COMPROBACIÓN ---');

  // 1. Eliminar agendas de prueba
  await request(`/schedules/${idAgendaSecundaria}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  await request(`/schedules/${idAgenda}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  const [agendasCheck] = await pool.query('SELECT COUNT(*) AS c FROM agendas WHERE id_agenda IN (?, ?)', [idAgenda, idAgendaSecundaria]);
  assert(agendasCheck[0].c === 0, 'MySQL: Ambas agendas de prueba fueron eliminadas');

  // 2. Eliminar detalle de evento
  const deleteDetailRes = await request(`/detalle-eventos/${idDetalle}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deleteDetailRes.status === 200, 'DELETE /detalle-eventos/:id elimina el detalle');
  const [detailCheck] = await pool.query('SELECT COUNT(*) AS c FROM detalle_eventos WHERE id_detalle = ?', [idDetalle]);
  assert(detailCheck[0].c === 0, 'MySQL: Detalle eliminado satisfactoriamente');

  // 3. Eliminar evento
  const deleteEventRes = await request(`/eventos/${idEvento}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deleteEventRes.status === 200, 'DELETE /eventos/:id ahora que no tiene detalles ni agenda se elimina');
  const [eventCheck] = await pool.query('SELECT COUNT(*) AS c FROM eventos WHERE id_evento = ?', [idEvento]);
  assert(eventCheck[0].c === 0, 'MySQL: Evento eliminado satisfactoriamente');

  // 4. Eliminar servicio de prueba
  const deleteServiceRes = await request(`/servicios/${idServicio}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deleteServiceRes.status === 200, 'DELETE /servicios/:id elimina servicio sin dependencias');
  const [serviceCheck] = await pool.query('SELECT COUNT(*) AS c FROM servicios WHERE id_servicio = ?', [idServicio]);
  assert(serviceCheck[0].c === 0, 'MySQL: Servicio eliminado satisfactoriamente');

  // 5. Eliminar usuario de prueba
  const deleteUserRes = await request(`/usuarios/${idUsuario}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deleteUserRes.status === 200, 'DELETE /usuarios/:id elimina usuario de prueba');
  const [userCheck] = await pool.query('SELECT COUNT(*) AS c FROM usuarios WHERE id_usuario = ?', [idUsuario]);
  assert(userCheck[0].c === 0, 'MySQL: Usuario eliminado satisfactoriamente');

  // 6. Eliminar cliente de prueba
  const deleteClientRes = await request(`/clientes/${idCliente}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deleteClientRes.status === 200, 'DELETE /clientes/:id elimina cliente sin eventos');
  const [clientCheck] = await pool.query('SELECT COUNT(*) AS c FROM clientes WHERE id_cliente = ?', [idCliente]);
  assert(clientCheck[0].c === 0, 'MySQL: Cliente eliminado satisfactoriamente');

  console.log('\n================================================================');
  console.log('[SUITE] PERSISTENCIA REAL COMPROBADA CON ÉXITO EN MYSQL 8.0');
  console.log('================================================================\n');
  process.exit(0);
}

runPersistenceSuite().catch(err => {
  console.error('\n[ERROR FATAL EN SUITE DE PERSISTENCIA]', err);
  process.exit(1);
});
