import pool from '../config/db.js';

export const AgendaNotasModel = {
  async findByAgenda(id_agenda) {
    const [rows] = await pool.query(
      `SELECT n.id_nota, n.id_agenda, n.id_usuario, n.descripcion, n.completada, n.fecha_limite, n.fecha_creacion,
              u.nombre AS autor_nombre, r.nombre AS autor_rol
       FROM agenda_notas n
       INNER JOIN usuarios u ON n.id_usuario = u.id_usuario
       INNER JOIN roles r ON u.id_rol = r.id_rol
       WHERE n.id_agenda = ?
       ORDER BY n.id_nota ASC`,
      [id_agenda]
    );
    return rows;
  },

  async findById(id_nota) {
    const [rows] = await pool.query(
      `SELECT n.id_nota, n.id_agenda, n.id_usuario, n.descripcion, n.completada, n.fecha_limite, n.fecha_creacion,
              u.nombre AS autor_nombre, r.nombre AS autor_rol,
              a.id_responsable, a.id_evento
       FROM agenda_notas n
       INNER JOIN usuarios u ON n.id_usuario = u.id_usuario
       INNER JOIN roles r ON u.id_rol = r.id_rol
       INNER JOIN agendas a ON n.id_agenda = a.id_agenda
       WHERE n.id_nota = ?`,
      [id_nota]
    );
    return rows[0] || null;
  },

  async create({ id_agenda, id_usuario, descripcion, fecha_limite = null }) {
    const [result] = await pool.query(
      `INSERT INTO agenda_notas (id_agenda, id_usuario, descripcion, completada, fecha_limite)
       VALUES (?, ?, ?, FALSE, ?)`,
      [id_agenda, id_usuario, descripcion.trim(), fecha_limite || null]
    );
    return this.findById(result.insertId);
  },

  async update(id_nota, { descripcion, completada, fecha_limite }) {
    const fields = [];
    const params = [];

    if (descripcion !== undefined) {
      fields.push('descripcion = ?');
      params.push(descripcion.trim());
    }
    if (completada !== undefined) {
      fields.push('completada = ?');
      params.push(Boolean(completada));
    }
    if (fecha_limite !== undefined) {
      fields.push('fecha_limite = ?');
      params.push(fecha_limite || null);
    }

    if (fields.length === 0) return this.findById(id_nota);

    params.push(id_nota);
    await pool.query(`UPDATE agenda_notas SET ${fields.join(', ')} WHERE id_nota = ?`, params);
    return this.findById(id_nota);
  },

  async delete(id_nota) {
    const [result] = await pool.query('DELETE FROM agenda_notas WHERE id_nota = ?', [id_nota]);
    return result.affectedRows > 0;
  }
};

