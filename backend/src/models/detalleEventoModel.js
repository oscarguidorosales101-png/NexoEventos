import pool from '../config/db.js';

export const DetalleEventoModel = {
  async findAll({ id_evento = null, id_cliente = null } = {}) {
    let sql = `
      SELECT de.id_detalle, de.id_evento, de.id_servicio, de.cantidad, de.precio_unitario,
             (de.cantidad * de.precio_unitario) AS subtotal,
             e.nombre AS nombre_evento, e.fecha_evento, e.id_cliente,
             s.nombre AS nombre_servicio, s.descripcion AS descripcion_servicio, s.precio AS precio_catalogo_actual
      FROM detalle_eventos de
      INNER JOIN eventos e ON de.id_evento = e.id_evento
      INNER JOIN servicios s ON de.id_servicio = s.id_servicio
    `;
    const conditions = [];
    const params = [];

    if (id_evento) {
      conditions.push('de.id_evento = ?');
      params.push(id_evento);
    }
    if (id_cliente) {
      conditions.push('e.id_cliente = ?');
      params.push(id_cliente);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY de.id_detalle DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id_detalle) {
    const [rows] = await pool.query(
      `SELECT de.id_detalle, de.id_evento, de.id_servicio, de.cantidad, de.precio_unitario,
              (de.cantidad * de.precio_unitario) AS subtotal,
              e.nombre AS nombre_evento, e.fecha_evento, e.id_cliente,
              s.nombre AS nombre_servicio, s.descripcion AS descripcion_servicio, s.precio AS precio_catalogo_actual
       FROM detalle_eventos de
       INNER JOIN eventos e ON de.id_evento = e.id_evento
       INNER JOIN servicios s ON de.id_servicio = s.id_servicio
       WHERE de.id_detalle = ?`,
      [id_detalle]
    );
    return rows[0] || null;
  },

  async findByEventoAndServicio(id_evento, id_servicio) {
    const [rows] = await pool.query(
      `SELECT de.id_detalle, de.id_evento, de.id_servicio, de.cantidad, de.precio_unitario
       FROM detalle_eventos de
       WHERE de.id_evento = ? AND de.id_servicio = ?`,
      [id_evento, id_servicio]
    );
    return rows[0] || null;
  },

  async create({ id_evento, id_servicio, cantidad, precio_unitario }) {
    const [result] = await pool.query(
      `INSERT INTO detalle_eventos (id_evento, id_servicio, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?)`,
      [id_evento, id_servicio, Number(cantidad), Number(precio_unitario)]
    );
    return this.findById(result.insertId);
  },

  async update(id_detalle, { id_evento, id_servicio, cantidad, precio_unitario }) {
    await pool.query(
      `UPDATE detalle_eventos
       SET id_evento = ?, id_servicio = ?, cantidad = ?, precio_unitario = ?
       WHERE id_detalle = ?`,
      [id_evento, id_servicio, Number(cantidad), Number(precio_unitario), id_detalle]
    );
    return this.findById(id_detalle);
  },

  async delete(id_detalle) {
    const [result] = await pool.query('DELETE FROM detalle_eventos WHERE id_detalle = ?', [id_detalle]);
    return result.affectedRows > 0;
  }
};

