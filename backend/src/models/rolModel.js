import pool from '../config/db.js';

export const RolModel = {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id_rol, nombre, descripcion FROM roles ORDER BY id_rol ASC'
    );
    return rows;
  },

  async findById(id_rol) {
    const [rows] = await pool.query(
      'SELECT id_rol, nombre, descripcion FROM roles WHERE id_rol = ?',
      [id_rol]
    );
    return rows[0] || null;
  },

  async findByName(nombre) {
    const [rows] = await pool.query(
      'SELECT id_rol, nombre, descripcion FROM roles WHERE LOWER(nombre) = LOWER(?)',
      [nombre]
    );
    return rows[0] || null;
  },

  async create({ nombre, descripcion }) {
    const [result] = await pool.query(
      'INSERT INTO roles (nombre, descripcion) VALUES (?, ?)',
      [nombre.trim(), descripcion ? descripcion.trim() : null]
    );
    return this.findById(result.insertId);
  },

  async update(id_rol, { nombre, descripcion }) {
    await pool.query(
      'UPDATE roles SET nombre = ?, descripcion = ? WHERE id_rol = ?',
      [nombre.trim(), descripcion ? descripcion.trim() : null, id_rol]
    );
    return this.findById(id_rol);
  },

  async delete(id_rol) {
    const [result] = await pool.query('DELETE FROM roles WHERE id_rol = ?', [id_rol]);
    return result.affectedRows > 0;
  },

  async countUsersWithRole(id_rol) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM usuarios WHERE id_rol = ?',
      [id_rol]
    );
    return rows[0].total;
  }
};

