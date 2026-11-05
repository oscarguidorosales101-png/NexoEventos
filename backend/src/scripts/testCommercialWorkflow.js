import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function verifyFlow() {
  console.log('================================================================');
  console.log('[TEST-FLUJO] VERIFICACION EXHAUSTIVA: EVENTO COMERCIAL -> AGENDA');
  console.log('================================================================');

  // 1. Iniciar sesión como Supervisor
  const supLogin = await request('/auth/login', {
    method: 'POST',
    body: { correo: 'supervisor@nexoeventos.com', password: 'Supervisor1234*' }
  });
  if (supLogin.status !== 200 || !supLogin.data.data.token) {
    throw new Error('No se pudo autenticar como Supervisor');
  }
  const supervisorToken = supLogin.data.data.token;
  console.log('[1] Supervisor autenticado exitosamente (JWT obtenido)');

  // 2. Crear un nuevo evento comercial en estado "pendiente"
  const nuevoEventoRes = await request('/eventos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: {
      id_cliente: 1,
      nombre: 'Gala Corporativa Anual Nexo 2026',
      tipo_evento: 'Corporativo',
      fecha_evento: '2026-11-20',
      ubicacion: 'Gran Salón Real Diamante',
      estado: 'pendiente'
    }
  });
  if (nuevoEventoRes.status !== 201) {
    throw new Error(`Fallo al crear evento pendiente: ${JSON.stringify(nuevoEventoRes.data)}`);
  }
  const idEvento = nuevoEventoRes.data.data.id_evento;
  console.log(`[2] Evento comercial creado con ID #${idEvento} en estado: 'pendiente'`);

  // 3. Supervisor aprueba y confirma el evento comercial
  const aprobarRes = await request(`/eventos/${idEvento}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: { estado: 'confirmado' }
  });
  if (aprobarRes.status !== 200 || aprobarRes.data.data.estado !== 'confirmado') {
    throw new Error('Fallo al aprobar el evento a estado confirmado');
  }
  console.log(`[3] Evento comercial #${idEvento} aprobado y confirmado por el Supervisor`);

  // 4. Consultar eventos y verificar que está disponible con estado 'confirmado'
  const listaEventos = await request('/eventos', {
    headers: { Authorization: `Bearer ${supervisorToken}` }
  });
  const eventoConfirmado = listaEventos.data.data.find(e => e.id_evento === idEvento);
  if (!eventoConfirmado || eventoConfirmado.estado !== 'confirmado') {
    throw new Error('El evento no figura como confirmado en la lista de eventos');
  }
  console.log(`[4] Evento verificado en catálogo: "${eventoConfirmado.nombre}" (Cliente: ${eventoConfirmado.nombre_cliente})`);

  // 5. Consultar categorías y candidatos de personal para PIC y equipo
  const [categoriesRes, candidatesRes] = await Promise.all([
    request('/schedules/categories', { headers: { Authorization: `Bearer ${supervisorToken}` } }),
    request('/schedules/team-candidates', { headers: { Authorization: `Bearer ${supervisorToken}` } })
  ]);

  if (categoriesRes.status !== 200 || categoriesRes.data.data.length === 0) {
    throw new Error('No se encontraron categorías de agenda');
  }
  const categoria = categoriesRes.data.data[0];

  if (candidatesRes.status !== 200 || candidatesRes.data.data.length === 0) {
    throw new Error('No se encontraron candidatos de personal');
  }
  const pic = candidatesRes.data.data[0];
  const staffMember = candidatesRes.data.data[1] || candidatesRes.data.data[0];
  console.log(`[5] Categoría: "${categoria.nombre}" | Responsable Principal (PIC): ${pic.nombre} (${pic.rol_nombre || pic.rol})`);

  // 6. Programar nueva actividad vinculada a este evento comercial (Payload exacto de ScheduleFormModal)
  const agendaPayload = {
    id_categoria: categoria.id_categoria,
    id_evento: idEvento,
    id_responsable: pic.id_usuario,
    titulo: 'Montaje Audiovisual y Logística Gala Nexo',
    descripcion: 'Montaje de pantallas LED, sonido lineal y prueba de sonido.',
    fecha_inicio: '2026-11-20 08:00:00',
    fecha_fin: '2026-11-20 12:00:00',
    ubicacion: 'Gran Salón Real Diamante',
    teamUserIds: [pic.id_usuario, staffMember.id_usuario]
  };

  const createScheduleRes = await request('/schedules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: agendaPayload
  });

  if (createScheduleRes.status !== 201) {
    throw new Error(`Fallo al crear la actividad de agenda: ${JSON.stringify(createScheduleRes.data)}`);
  }
  const idAgenda = createScheduleRes.data.data.id_agenda;
  console.log(`[6] Actividad de agenda creada exitosamente con ID #${idAgenda}`);

  // 7. Consultar MySQL directamente para validar integridad referencial y persistencia
  const { default: pool } = await import('../config/db.js');
  const [rowsAgenda] = await pool.query(
    'SELECT id_agenda, id_evento, id_responsable, titulo, ubicacion FROM agendas WHERE id_agenda = ?',
    [idAgenda]
  );
  if (rowsAgenda.length === 0 || rowsAgenda[0].id_evento !== idEvento || rowsAgenda[0].id_responsable !== pic.id_usuario) {
    throw new Error('Validación MySQL falló para la tabla agendas');
  }
  console.log('[7] Persistencia en tabla `agendas` verificada en MySQL:', rowsAgenda[0]);

  const [rowsIntegrantes] = await pool.query(
    'SELECT ai.id_agenda, ai.id_usuario, u.nombre, r.nombre AS rol FROM agenda_integrantes ai JOIN usuarios u ON ai.id_usuario = u.id_usuario JOIN roles r ON u.id_rol = r.id_rol WHERE ai.id_agenda = ?',
    [idAgenda]
  );
  console.log(`[8] Integrantes persistidos en tabla \`agenda_integrantes\` (${rowsIntegrantes.length} miembros):`);
  rowsIntegrantes.forEach(m => console.log(`    - ID Usuario: ${m.id_usuario} | ${m.nombre} (${m.rol})`));

  // 8. Consultar la actividad vía API REST con join completo
  const getDetailRes = await request(`/schedules/${idAgenda}`, {
    headers: { Authorization: `Bearer ${supervisorToken}` }
  });
  const detail = getDetailRes.data.data;
  console.log('[9] Consulta GET /api/schedules/:id retorna:');
  console.log(`    - Título: ${detail.titulo}`);
  console.log(`    - Evento Comercial Asociado: #${detail.id_evento} - ${detail.nombre_evento || detail.evento_nombre}`);
  console.log(`    - Responsable Principal (PIC): ${detail.nombre_responsable || detail.responsable_nombre} (${detail.rol_responsable || detail.responsable_rol})`);
  console.log(`    - Total Integrantes en Equipo: ${detail.integrantes.length}`);

  // 9. Limpieza de datos de prueba
  await request(`/schedules/${idAgenda}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${supervisorToken}` }
  });
  await request(`/eventos/${idEvento}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${supervisorToken}` }
  });
  console.log('[10] Limpieza de registros de prueba completada.');

  console.log('================================================================');
  console.log('[TEST-FLUJO] RESULTADO: FLUJO COMPLETO APROBADO EXITOSAMENTE');
  console.log('================================================================\n');
  process.exit(0);
}

verifyFlow().catch(err => {
  console.error('[ERROR EN FLUJO]', err);
  process.exit(1);
});
