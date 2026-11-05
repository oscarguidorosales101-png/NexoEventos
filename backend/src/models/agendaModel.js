import pool from '../config/db.js';
import { AgendaIntegrantesModel } from './agendaIntegrantesModel.js';
import { AgendaNotasModel } from './agendaNotasModel.js';

export const AgendaModel = {
  /**
   * Listar agendas con filtros multidimensionales y control de acceso por rol
   */
  async findAll({
    month = null,
    year = null,
    startDate = null,
    endDate = null,
    category = null,
    status = null,
    responsible = null,
    search = null,
    id_cliente = null,
    role = null
  } = {}) {
    let sql = `
      SELECT a.id_agenda, a.id_categoria, a.id_evento, a.id_responsable, a.titulo, a.descripcion,
             a.fecha_inicio, a.fecha_fin, a.ubicacion, a.imagen_portada, a.estado, a.fecha_creacion,
             c.nombre AS nombre_categoria, c.color AS color_categoria,
             u.nombre AS nombre_responsable, u.correo AS correo_responsable, r.nombre AS rol_responsable,
             e.nombre AS nombre_evento, e.tipo_evento, e.id_cliente,
             COUNT(DISTINCT n.id_nota) AS total_notas,
             COUNT(DISTINCT CASE WHEN n.completada = TRUE THEN n.id_nota END) AS total_notas_completadas
      FROM agendas a
      INNER JOIN categorias_agenda c ON a.id_categoria = c.id_categoria
      INNER JOIN usuarios u ON a.id_responsable = u.id_usuario
      INNER JOIN roles r ON u.id_rol = r.id_rol
      LEFT JOIN eventos e ON a.id_evento = e.id_evento
      LEFT JOIN agenda_notas n ON a.id_agenda = n.id_agenda
    `;

    const conditions = [];
    const params = [];

    // REGLA DE SEGURIDAD PARA CLIENTES:
    // Los clientes solo pueden ver agendas asociadas a sus propios eventos comerciales
    // y NUNCA reuniones internas, montajes internos o fechas límite privadas de la empresa.
    if (role === 'cliente') {
      if (!id_cliente) {
        return [];
      }
      conditions.push('e.id_cliente = ?');
      params.push(id_cliente);
      conditions.push("c.nombre = 'Event'");
    }

    // Filtros temporales
    if (startDate && endDate) {
      conditions.push('a.fecha_inicio <= ? AND a.fecha_fin >= ?');
      params.push(endDate, startDate);
    } else if (startDate) {
      conditions.push('a.fecha_fin >= ?');
      params.push(startDate);
    } else if (endDate) {
      conditions.push('a.fecha_inicio <= ?');
      params.push(endDate);
    } else if (month && year) {
      conditions.push('MONTH(a.fecha_inicio) = ? AND YEAR(a.fecha_inicio) = ?');
      params.push(Number(month), Number(year));
    } else if (year) {
      conditions.push('YEAR(a.fecha_inicio) = ?');
      params.push(Number(year));
    }

    // Filtro por categoría (ID o Nombre)
    if (category) {
      if (isNaN(category)) {
        conditions.push('LOWER(c.nombre) = LOWER(?)');
        params.push(category.trim());
      } else {
        conditions.push('a.id_categoria = ?');
        params.push(Number(category));
      }
    }

    // Filtro por estado
    if (status && status !== 'todos') {
      conditions.push('a.estado = ?');
      params.push(status);
    }

    // Filtro por responsable
    if (responsible) {
      conditions.push('a.id_responsable = ?');
      params.push(Number(responsible));
    }

    // Búsqueda textual
    if (search && search.trim()) {
      conditions.push('(a.titulo LIKE ? OR a.descripcion LIKE ? OR a.ubicacion LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY a.id_agenda ORDER BY a.fecha_inicio ASC';

    const [rows] = await pool.query(sql, params);

    // Obtener integrantes asignados para cada agenda
    for (const agenda of rows) {
      agenda.integrantes = await AgendaIntegrantesModel.findByAgenda(agenda.id_agenda);
    }

    return rows;
  },

  /**
   * Consultar una agenda por ID con todos sus detalles, equipo y notas
   */
  async findById(id_agenda) {
    const [rows] = await pool.query(
      `SELECT a.id_agenda, a.id_categoria, a.id_evento, a.id_responsable, a.titulo, a.descripcion,
              a.fecha_inicio, a.fecha_fin, a.ubicacion, a.imagen_portada, a.estado, a.fecha_creacion, a.fecha_actualizacion,
              c.nombre AS nombre_categoria, c.color AS color_categoria,
              u.nombre AS nombre_responsable, u.correo AS correo_responsable, r.nombre AS rol_responsable,
              e.nombre AS nombre_evento, e.tipo_evento, e.id_cliente,
              cl.nombre AS nombre_cliente, cl.telefono AS telefono_cliente
       FROM agendas a
       INNER JOIN categorias_agenda c ON a.id_categoria = c.id_categoria
       INNER JOIN usuarios u ON a.id_responsable = u.id_usuario
       INNER JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN eventos e ON a.id_evento = e.id_evento
       LEFT JOIN clientes cl ON e.id_cliente = cl.id_cliente
       WHERE a.id_agenda = ?`,
      [id_agenda]
    );

    if (rows.length === 0) return null;

    const agenda = rows[0];
    agenda.integrantes = await AgendaIntegrantesModel.findByAgenda(id_agenda);
    agenda.notas = await AgendaNotasModel.findByAgenda(id_agenda);

    return agenda;
  },

  /**
   * Detección de colisiones e interferencias de horario entre responsables y miembros
   */
  async checkConflict({ id_responsable, teamUserIds = [], fecha_inicio, fecha_fin, excludeAgendaId = null }) {
    const userIdsToCheck = Array.from(new Set([
      Number(id_responsable),
      ...teamUserIds.map(Number)
    ])).filter(id => !isNaN(id) && id > 0);

    if (userIdsToCheck.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    let sql = `
      SELECT a.id_agenda, a.titulo, a.fecha_inicio, a.fecha_fin, a.id_responsable,
             u.nombre AS nombre_usuario_en_conflicto,
             CASE WHEN a.id_responsable = u.id_usuario THEN 'Responsable' ELSE 'Integrante del equipo' END AS rol_en_conflicto
      FROM agendas a
      INNER JOIN (
        SELECT id_agenda, id_responsable AS id_usuario FROM agendas
        UNION
        SELECT id_agenda, id_usuario FROM agenda_integrantes
      ) AS asignaciones ON a.id_agenda = asignaciones.id_agenda
      INNER JOIN usuarios u ON asignaciones.id_usuario = u.id_usuario
      WHERE asignaciones.id_usuario IN (?)
        AND a.fecha_inicio < ? AND a.fecha_fin > ?
    `;

    const params = [userIdsToCheck, fecha_fin, fecha_inicio];

    if (excludeAgendaId) {
      sql += ' AND a.id_agenda != ?';
      params.push(Number(excludeAgendaId));
    }

    const [rows] = await pool.query(sql, params);

    if (rows.length > 0) {
      return {
        hasConflict: true,
        conflicts: rows
      };
    }

    return { hasConflict: false, conflicts: [] };
  },

  /**
   * Buscar agenda principal (categoría 'Event', id_categoria = 1) para un evento comercial
   */
  async findMainScheduleByEvent(id_evento) {
    if (!id_evento) return null;
    const [rows] = await pool.query(
      `SELECT a.id_agenda, a.titulo, a.fecha_inicio, a.fecha_fin, a.id_categoria, a.id_evento
       FROM agendas a
       WHERE a.id_evento = ? AND a.id_categoria = 1
       LIMIT 1`,
      [Number(id_evento)]
    );
    return rows[0] || null;
  },

  /**
   * Crear nueva agenda en base de datos
   */
  async create({
    id_categoria,
    id_evento = null,
    id_responsable,
    titulo,
    descripcion = null,
    fecha_inicio,
    fecha_fin,
    ubicacion,
    imagen_portada = null,
    estado = 'programada',
    teamUserIds = []
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Bloqueo pesimista concurrente para garantizar que un evento solo tenga 1 agenda principal
      if (Number(id_categoria) === 1 && id_evento) {
        const [existing] = await connection.query(
          `SELECT id_agenda, titulo FROM agendas 
           WHERE id_evento = ? AND id_categoria = 1 
           FOR UPDATE`,
          [Number(id_evento)]
        );
        if (existing.length > 0) {
          const conflictErr = new Error(`El evento comercial ya cuenta con una agenda principal programada (#${existing[0].id_agenda} - ${existing[0].titulo}).`);
          conflictErr.code = 'ER_DUP_ENTRY';
          conflictErr.statusCode = 409;
          throw conflictErr;
        }
      }

      const [result] = await connection.query(
        `INSERT INTO agendas (id_categoria, id_evento, id_responsable, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, imagen_portada, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(id_categoria),
          id_evento ? Number(id_evento) : null,
          Number(id_responsable),
          titulo.trim(),
          descripcion ? descripcion.trim() : null,
          fecha_inicio,
          fecha_fin,
          ubicacion.trim(),
          imagen_portada ? imagen_portada.trim() : null,
          estado
        ]
      );

      const id_agenda = result.insertId;

      // Asignar integrantes del equipo
      if (Array.isArray(teamUserIds) && teamUserIds.length > 0) {
        for (const userId of teamUserIds) {
          if (userId) {
            await connection.query(
              `INSERT INTO agenda_integrantes (id_agenda, id_usuario)
               VALUES (?, ?)
               ON DUPLICATE KEY UPDATE fecha_asignacion = CURRENT_TIMESTAMP`,
              [id_agenda, Number(userId)]
            );
          }
        }
      }

      await connection.commit();
      return this.findById(id_agenda);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Actualizar agenda existente
   */
  async update(id_agenda, fields) {
    const allowed = ['id_categoria', 'id_evento', 'id_responsable', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'ubicacion', 'imagen_portada', 'estado'];
    const updateClauses = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updateClauses.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updateClauses.length > 0) {
      params.push(id_agenda);
      await pool.query(`UPDATE agendas SET ${updateClauses.join(', ')} WHERE id_agenda = ?`, params);
    }

    if (fields.teamUserIds !== undefined && Array.isArray(fields.teamUserIds)) {
      await pool.query('DELETE FROM agenda_integrantes WHERE id_agenda = ?', [id_agenda]);
      for (const userId of fields.teamUserIds) {
        if (userId) {
          await AgendaIntegrantesModel.addMember(id_agenda, Number(userId));
        }
      }
    }

    return this.findById(id_agenda);
  },

  /**
   * Reprogramar fechas de una agenda (Drag & Drop o edición rápida)
   */
  async reschedule(id_agenda, fecha_inicio, fecha_fin) {
    await pool.query(
      'UPDATE agendas SET fecha_inicio = ?, fecha_fin = ? WHERE id_agenda = ?',
      [fecha_inicio, fecha_fin, id_agenda]
    );
    return this.findById(id_agenda);
  },

  /**
   * Eliminar agenda
   */
  async delete(id_agenda) {
    const [result] = await pool.query('DELETE FROM agendas WHERE id_agenda = ?', [id_agenda]);
    return result.affectedRows > 0;
  },

  /**
   * Obtener contadores para las 5 tarjetas de resumen
   */
  async getSummaryCounters({
    month = null,
    year = null,
    startDate = null,
    endDate = null,
    id_cliente = null,
    role = null
  } = {}) {
    let sql = `
      SELECT 
        COUNT(a.id_agenda) AS total_all,
        COUNT(CASE WHEN c.nombre = 'Event' THEN a.id_agenda END) AS total_event,
        COUNT(CASE WHEN c.nombre = 'Meeting' THEN a.id_agenda END) AS total_meeting,
        COUNT(CASE WHEN c.nombre = 'Setup and Rehearsal' THEN a.id_agenda END) AS total_setup_rehearsal,
        COUNT(CASE WHEN c.nombre = 'Task Deadlines' THEN a.id_agenda END) AS total_task_deadlines
      FROM agendas a
      INNER JOIN categorias_agenda c ON a.id_categoria = c.id_categoria
      LEFT JOIN eventos e ON a.id_evento = e.id_evento
    `;

    const conditions = [];
    const params = [];

    if (role === 'cliente') {
      if (!id_cliente) {
        return { all: 0, event: 0, meeting: 0, setupAndRehearsal: 0, taskDeadlines: 0 };
      }
      conditions.push('e.id_cliente = ?');
      params.push(id_cliente);
      conditions.push("c.nombre = 'Event'");
    }

    if (startDate && endDate) {
      conditions.push('a.fecha_inicio <= ? AND a.fecha_fin >= ?');
      params.push(endDate, startDate);
    } else if (month && year) {
      conditions.push('MONTH(a.fecha_inicio) = ? AND YEAR(a.fecha_inicio) = ?');
      params.push(Number(month), Number(year));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await pool.query(sql, params);
    const data = rows[0] || {};

    return {
      all: Number(data.total_all || 0),
      event: Number(data.total_event || 0),
      meeting: Number(data.total_meeting || 0),
      setupAndRehearsal: Number(data.total_setup_rehearsal || 0),
      taskDeadlines: Number(data.total_task_deadlines || 0)
    };
  }
};

