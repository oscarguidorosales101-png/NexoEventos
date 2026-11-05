import pool from '../config/db.js';

export const EventoModel = {
  async findAll({ id_cliente = null } = {}) {
    let sql = `
      SELECT e.id_evento, e.id_cliente, e.nombre, e.tipo_evento, e.fecha_evento, e.ubicacion, e.estado,
             c.nombre AS nombre_cliente, c.tipo_cliente, c.correo AS correo_cliente, c.telefono AS telefono_cliente,
             COALESCE((SELECT SUM(de.cantidad * de.precio_unitario) FROM detalle_eventos de WHERE de.id_evento = e.id_evento), 0) AS total_presupuesto,
             COALESCE((SELECT COUNT(de.id_detalle) FROM detalle_eventos de WHERE de.id_evento = e.id_evento), 0) AS total_servicios,
             (SELECT ag.id_agenda FROM agendas ag WHERE ag.id_evento = e.id_evento AND ag.id_categoria = 1 LIMIT 1) AS id_agenda_principal,
             CASE WHEN (SELECT ag.id_agenda FROM agendas ag WHERE ag.id_evento = e.id_evento AND ag.id_categoria = 1 LIMIT 1) IS NOT NULL THEN TRUE ELSE FALSE END AS tiene_agenda_principal
      FROM eventos e
      INNER JOIN clientes c ON e.id_cliente = c.id_cliente
    `;
    const params = [];
    if (id_cliente !== null && id_cliente !== undefined) {
      sql += ' WHERE e.id_cliente = ?';
      params.push(id_cliente);
    }
    sql += ' ORDER BY e.fecha_evento DESC, e.id_evento DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id_evento) {
    const [rows] = await pool.query(
      `SELECT e.id_evento, e.id_cliente, e.nombre, e.tipo_evento, e.fecha_evento, e.ubicacion, e.estado,
              c.nombre AS nombre_cliente, c.tipo_cliente, c.correo AS correo_cliente, c.telefono AS telefono_cliente,
              COALESCE((SELECT SUM(de.cantidad * de.precio_unitario) FROM detalle_eventos de WHERE de.id_evento = e.id_evento), 0) AS total_presupuesto,
              COALESCE((SELECT COUNT(de.id_detalle) FROM detalle_eventos de WHERE de.id_evento = e.id_evento), 0) AS total_servicios,
              (SELECT ag.id_agenda FROM agendas ag WHERE ag.id_evento = e.id_evento AND ag.id_categoria = 1 LIMIT 1) AS id_agenda_principal,
              CASE WHEN (SELECT ag.id_agenda FROM agendas ag WHERE ag.id_evento = e.id_evento AND ag.id_categoria = 1 LIMIT 1) IS NOT NULL THEN TRUE ELSE FALSE END AS tiene_agenda_principal
       FROM eventos e
       INNER JOIN clientes c ON e.id_cliente = c.id_cliente
       WHERE e.id_evento = ?`,
      [id_evento]
    );
    return rows[0] || null;
  },

  async create({ id_cliente, nombre, tipo_evento, fecha_evento, ubicacion, estado = 'pendiente' }) {
    const [result] = await pool.query(
      `INSERT INTO eventos (id_cliente, nombre, tipo_evento, fecha_evento, ubicacion, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_cliente, nombre.trim(), tipo_evento.trim(), fecha_evento, ubicacion.trim(), estado]
    );
    return this.findById(result.insertId);
  },

  async update(id_evento, { id_cliente, nombre, tipo_evento, fecha_evento, ubicacion, estado }) {
    await pool.query(
      `UPDATE eventos 
       SET id_cliente = ?, nombre = ?, tipo_evento = ?, fecha_evento = ?, ubicacion = ?, estado = ?
       WHERE id_evento = ?`,
      [id_cliente, nombre.trim(), tipo_evento.trim(), fecha_evento, ubicacion.trim(), estado, id_evento]
    );
    return this.findById(id_evento);
  },

  async delete(id_evento) {
    const [result] = await pool.query('DELETE FROM eventos WHERE id_evento = ?', [id_evento]);
    return result.affectedRows > 0;
  },

  async countDetalles(id_evento) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM detalle_eventos WHERE id_evento = ?',
      [id_evento]
    );
    return rows[0].total;
  }
};

