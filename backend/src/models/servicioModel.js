import pool from '../config/db.js';

export const ServicioModel = {
  async findAll({ onlyActive = false } = {}) {
    let sql = 'SELECT id_servicio, nombre, descripcion, precio, estado FROM servicios';
    const params = [];
    if (onlyActive) {
      sql += ' WHERE estado = ?';
      params.push('activo');
    }
    sql += ' ORDER BY id_servicio ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id_servicio) {
    const [rows] = await pool.query(
      'SELECT id_servicio, nombre, descripcion, precio, estado FROM servicios WHERE id_servicio = ?',
      [id_servicio]
    );
    return rows[0] || null;
  },

  async create({ nombre, descripcion, precio, estado = 'activo' }) {
    const [result] = await pool.query(
      'INSERT INTO servicios (nombre, descripcion, precio, estado) VALUES (?, ?, ?, ?)',
      [nombre.trim(), descripcion ? descripcion.trim() : null, Number(precio), estado]
    );
    return this.findById(result.insertId);
  },

  async update(id_servicio, { nombre, descripcion, precio, estado }) {
    await pool.query(
      'UPDATE servicios SET nombre = ?, descripcion = ?, precio = ?, estado = ? WHERE id_servicio = ?',
      [nombre.trim(), descripcion ? descripcion.trim() : null, Number(precio), estado, id_servicio]
    );
    return this.findById(id_servicio);
  },

  async delete(id_servicio) {
    const [result] = await pool.query('DELETE FROM servicios WHERE id_servicio = ?', [id_servicio]);
    return result.affectedRows > 0;
  },

  async countDetalleEvents(id_servicio) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM detalle_eventos WHERE id_servicio = ?',
      [id_servicio]
    );
    return rows[0].total;
  }
};

