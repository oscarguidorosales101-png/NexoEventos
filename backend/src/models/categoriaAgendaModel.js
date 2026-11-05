import pool from '../config/db.js';

export const CategoriaAgendaModel = {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id_categoria, nombre, color, descripcion FROM categorias_agenda ORDER BY id_categoria ASC'
    );
    return rows;
  },

  async findById(id_categoria) {
    const [rows] = await pool.query(
      'SELECT id_categoria, nombre, color, descripcion FROM categorias_agenda WHERE id_categoria = ?',
      [id_categoria]
    );
    return rows[0] || null;
  },

  async findByName(nombre) {
    const [rows] = await pool.query(
      'SELECT id_categoria, nombre, color, descripcion FROM categorias_agenda WHERE LOWER(nombre) = LOWER(?)',
      [nombre.trim()]
    );
    return rows[0] || null;
  }
};

