import pool from '../config/db.js';

export const ClienteModel = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT c.id_cliente, c.tipo_cliente, c.nombre, c.correo, c.telefono, c.direccion, c.fecha_registro,
              COUNT(DISTINCT e.id_evento) AS total_eventos,
              COUNT(DISTINCT u.id_usuario) AS total_usuarios
       FROM clientes c
       LEFT JOIN eventos e ON c.id_cliente = e.id_cliente
       LEFT JOIN usuarios u ON c.id_cliente = u.id_cliente
       GROUP BY c.id_cliente
       ORDER BY c.id_cliente DESC`
    );
    return rows;
  },

  async findById(id_cliente) {
    const [rows] = await pool.query(
      `SELECT c.id_cliente, c.tipo_cliente, c.nombre, c.correo, c.telefono, c.direccion, c.fecha_registro,
              COUNT(DISTINCT e.id_evento) AS total_eventos,
              COUNT(DISTINCT u.id_usuario) AS total_usuarios
       FROM clientes c
       LEFT JOIN eventos e ON c.id_cliente = e.id_cliente
       LEFT JOIN usuarios u ON c.id_cliente = u.id_cliente
       WHERE c.id_cliente = ?
       GROUP BY c.id_cliente`,
      [id_cliente]
    );
    return rows[0] || null;
  },

  async findByEmail(correo) {
    if (!correo) return null;
    const [rows] = await pool.query(
      'SELECT * FROM clientes WHERE LOWER(correo) = LOWER(?)',
      [correo.trim()]
    );
    return rows[0] || null;
  },

  async create({ tipo_cliente, nombre, correo, telefono, direccion }) {
    const [result] = await pool.query(
      `INSERT INTO clientes (tipo_cliente, nombre, correo, telefono, direccion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        tipo_cliente,
        nombre.trim(),
        correo ? correo.trim().toLowerCase() : null,
        telefono ? telefono.trim() : null,
        direccion ? direccion.trim() : null
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id_cliente, { tipo_cliente, nombre, correo, telefono, direccion }) {
    await pool.query(
      `UPDATE clientes 
       SET tipo_cliente = ?, nombre = ?, correo = ?, telefono = ?, direccion = ?
       WHERE id_cliente = ?`,
      [
        tipo_cliente,
        nombre.trim(),
        correo ? correo.trim().toLowerCase() : null,
        telefono ? telefono.trim() : null,
        direccion ? direccion.trim() : null,
        id_cliente
      ]
    );
    return this.findById(id_cliente);
  },

  async delete(id_cliente) {
    const [result] = await pool.query('DELETE FROM clientes WHERE id_cliente = ?', [id_cliente]);
    return result.affectedRows > 0;
  },

  async countEvents(id_cliente) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM eventos WHERE id_cliente = ?',
      [id_cliente]
    );
    return rows[0].total;
  },

  async countUsers(id_cliente) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM usuarios WHERE id_cliente = ?',
      [id_cliente]
    );
    return rows[0].total;
  }
};

