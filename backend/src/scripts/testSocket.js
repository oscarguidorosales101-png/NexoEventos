import { io } from 'socket.io-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;
const API_BASE = `http://localhost:${PORT}/api`;
const WS_BASE = `http://localhost:${PORT}`;

let passedTests = 0;
let failedTests = 0;

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
  const url = `${API_BASE}${endpoint}`;
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

async function login(correo, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { correo, password }
  });
  if (res.status !== 200 || !res.data?.data?.token) {
    throw new Error(`Fallo en login para ${correo}: status ${res.status}`);
  }
  return res.data.data.token;
}

function connectSocket(token, options = {}) {
  return io(WS_BASE, {
    auth: token ? { token } : undefined,
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    ...options
  });
}

function waitForEvent(socket, eventName, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout esperando evento '${eventName}' (${timeoutMs}ms)`));
    }, timeoutMs);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runSocketSuite() {
  console.log('\n======================================================');
  console.log('[SUITE] PRUEBAS DE COMUNICACIÓN EN TIEMPO REAL — SOCKET.IO');
  console.log(`[TARGET] Servidor WebSocket: ${WS_BASE}`);
  console.log('======================================================\n');

  let adminToken;
  let supervisorToken;
  let clientToken;

  let clientAdmin;
  let clientSupervisor;
  let clientCustomer;

  let createdScheduleId = null;

  try {
    // 1. Obtener credenciales JWT para las pruebas
    console.log('--- 1. Autenticación y Obtención de Tokens JWT ---');
    adminToken = await login('admin@nexoeventos.com', 'Admin1234*');
    supervisorToken = await login('supervisor@nexoeventos.com', 'Supervisor1234*');
    clientToken = await login('cliente@empresa.com', 'Cliente1234*');
    assert(adminToken && supervisorToken && clientToken, 'Tokens JWT emitidos correctamente para los 3 roles');

    // 2. Rechazo de conexiones no autenticadas o con token inválido
    console.log('\n--- 2. Seguridad en Handshake: Rechazo de Conexiones sin JWT o JWT Inválido ---');

    // 2.1 Conexión sin token
    const unauthSocket = connectSocket(null);
    const unauthError = await new Promise((resolve) => {
      unauthSocket.on('connect_error', (err) => resolve(err));
      unauthSocket.on('connect', () => resolve(null));
    });
    assert(unauthError && unauthError.message.includes('Autenticación requerida'), 'Conexión sin token es rechazada por el middleware de Socket.IO');
    unauthSocket.close();

    // 2.2 Conexión con token inválido / corrupto
    const invalidSocket = connectSocket('token_falso_y_corrupto_12345');
    const invalidError = await new Promise((resolve) => {
      invalidSocket.on('connect_error', (err) => resolve(err));
      invalidSocket.on('connect', () => resolve(null));
    });
    assert(invalidError && invalidError.message.includes('inválido o expirado'), 'Conexión con token inválido es rechazada por Socket.IO');
    invalidSocket.close();

    // 3. Conexión simultánea de clientes autorizados
    console.log('\n--- 3. Conexión Simultánea de Clientes Autorizados (Admin, Supervisor, Cliente) ---');
    clientAdmin = connectSocket(adminToken);
    clientSupervisor = connectSocket(supervisorToken);
    clientCustomer = connectSocket(clientToken);

    await Promise.all([
      new Promise((resolve, reject) => {
        clientAdmin.on('connect', resolve);
        clientAdmin.on('connect_error', reject);
      }),
      new Promise((resolve, reject) => {
        clientSupervisor.on('connect', resolve);
        clientSupervisor.on('connect_error', reject);
      }),
      new Promise((resolve, reject) => {
        clientCustomer.on('connect', resolve);
        clientCustomer.on('connect_error', reject);
      })
    ]);
    assert(clientAdmin.connected && clientSupervisor.connected && clientCustomer.connected, 'Tres clientes conectados simultáneamente con roles diferenciados');

    // 4. Creación de actividad y propagación en tiempo real
    console.log('\n--- 4. Creación de Agenda y Emisión en Tiempo Real (schedule:created) ---');

    // Contadores para verificar ausencia de eventos duplicados
    let supervisorCreatedCount = 0;
    let customerCreatedCount = 0;

    clientSupervisor.on('schedule:created', () => { supervisorCreatedCount++; });
    clientCustomer.on('schedule:created', () => { customerCreatedCount++; });

    const createPromise = waitForEvent(clientSupervisor, 'schedule:created');

    const createRes = await request('/schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id_categoria: 2, // Meeting (actividad interna de staff)
        id_responsable: 1,
        titulo: 'Reunión de Coordinación Operativa Socket Test',
        fecha_inicio: '2026-12-30 09:00:00',
        fecha_fin: '2026-12-30 10:30:00',
        ubicacion: 'Sala de Conferencias Principal',
        estado: 'programada'
      }
    });

    assert(createRes.status === 201 && createRes.data?.data?.id_agenda, 'POST /schedules crea actividad operativa');
    createdScheduleId = createRes.data?.data?.id_agenda;

    const createdData = await createPromise;
    assert(
      Number(createdData.id_agenda) === Number(createdScheduleId) && createdData.titulo === 'Reunión de Coordinación Operativa Socket Test',
      'Supervisor en sala staff recibe evento schedule:created con datos exactos'
    );

    // Esperar brevemente para verificar ausencia de eventos en el cliente (aislamiento de roles)
    await new Promise((r) => setTimeout(r, 200));
    assert(customerCreatedCount === 0, 'Aislamiento de roles: Cliente no recibe eventos de actividades internas (Meeting)');
    assert(supervisorCreatedCount === 1, 'Ausencia de eventos duplicados: Supervisor recibió exactamente 1 notificación');

    // 5. Actualización de actividad (schedule:updated)
    console.log('\n--- 5. Actualización de Agenda y Emisión en Tiempo Real (schedule:updated) ---');

    let adminUpdateCount = 0;
    clientAdmin.on('schedule:updated', () => { adminUpdateCount++; });

    const updatePromise = waitForEvent(clientAdmin, 'schedule:updated');

    const updateRes = await request(`/schedules/${createdScheduleId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${supervisorToken}` },
      body: {
        titulo: 'Reunión de Coordinación Operativa Socket Test - Modificada'
      }
    });

    assert(updateRes.status === 200, 'PATCH /schedules/:id actualiza metadatos de la agenda');

    const updatedData = await updatePromise;
    assert(
      Number(updatedData.id_agenda) === Number(createdScheduleId) && updatedData.titulo.includes('Modificada'),
      'Admin en sala staff recibe evento schedule:updated en tiempo real'
    );
    assert(adminUpdateCount === 1, 'Ausencia de duplicados en schedule:updated');

    // 6. Reprogramación mediante Drag & Drop (schedule:rescheduled)
    console.log('\n--- 6. Reprogramación Drag & Drop en Tiempo Real (schedule:rescheduled) ---');

    const reschedulePromise = waitForEvent(clientSupervisor, 'schedule:rescheduled');

    const rescheduleRes = await request(`/schedules/${createdScheduleId}/reschedule`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fecha_inicio: '2026-12-30 11:00:00',
        fecha_fin: '2026-12-30 12:30:00'
      }
    });

    assert(rescheduleRes.status === 200, 'PATCH /schedules/:id/reschedule reprograma horario');

    const rescheduledData = await reschedulePromise;
    assert(
      Number(rescheduledData.id_agenda) === Number(createdScheduleId) && rescheduledData.fecha_inicio.includes('11:00'),
      'Supervisor recibe evento schedule:rescheduled con el nuevo horario'
    );

    // 7. Eliminación de actividad (schedule:deleted)
    console.log('\n--- 7. Eliminación de Agenda y Emisión en Tiempo Real (schedule:deleted) ---');

    const deletePromise = waitForEvent(clientSupervisor, 'schedule:deleted');

    const deleteRes = await request(`/schedules/${createdScheduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert(deleteRes.status === 200, 'DELETE /schedules/:id elimina actividad');

    const deletedData = await deletePromise;
    assert(
      Number(deletedData.id_agenda) === Number(createdScheduleId),
      'Supervisor recibe evento schedule:deleted con el ID eliminado'
    );
    createdScheduleId = null; // Ya eliminado, no requiere limpieza

    // 8. Desconexión y Reconexión
    console.log('\n--- 8. Desconexión y Reconexión Limpia ---');

    // Desconectar cliente supervisor
    clientSupervisor.disconnect();
    assert(!clientSupervisor.connected, 'Cliente Supervisor desconectado exitosamente');

    // Reconectar cliente supervisor
    clientSupervisor.connect();
    await new Promise((resolve, reject) => {
      clientSupervisor.on('connect', resolve);
      clientSupervisor.on('connect_error', reject);
    });
    assert(clientSupervisor.connected, 'Cliente Supervisor reconectado exitosamente con sesión válida');

  } catch (error) {
    console.error('\n[ERROR INESPERADO EN TEST SOCKET]', error);
    failedTests++;
  } finally {
    // Limpieza preventiva si alguna aserción falló antes de borrar
    if (createdScheduleId && adminToken) {
      try {
        await request(`/schedules/${createdScheduleId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      } catch (e) {
        // Ignorar
      }
    }

    if (clientAdmin) clientAdmin.disconnect();
    if (clientSupervisor) clientSupervisor.disconnect();
    if (clientCustomer) clientCustomer.disconnect();

    console.log('\n======================================================');
    console.log(`[RESUMEN] RESULTADO DE PRUEBAS SOCKET.IO:`);
    console.log(`   Pruebas Exitosas: ${passedTests}`);
    console.log(`   Pruebas Fallidas: ${failedTests}`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runSocketSuite();

