import pool from '../config/db.js';

export const AgendaIntegrantesModel = {
  async findByAgenda(id_agenda) {
    const [rows] = await pool.query(
      `SELECT ai.id_agenda, ai.id_usuario, ai.fecha_asignacion,
              u.nombre, u.correo, r.nombre AS rol
       FROM agenda_integrantes ai
       INNER JOIN usuarios u ON ai.id_usuario = u.id_usuario
       INNER JOIN roles r ON u.id_rol = r.id_rol
       WHERE ai.id_agenda = ?
       ORDER BY u.nombre ASC`,
      [id_agenda]
    );
    return rows;
  },

  async addMember(id_agenda, id_usuario) {
    await pool.query(
      `INSERT INTO agenda_integrantes (id_agenda, id_usuario)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE fecha_asignacion = CURRENT_TIMESTAMP`,
      [id_agenda, id_usuario]
    );
    return true;
  },

  async removeMember(id_agenda, id_usuario) {
    const [result] = await pool.query(
      'DELETE FROM agenda_integrantes WHERE id_agenda = ? AND id_usuario = ?',
      [id_agenda, id_usuario]
    );
    return result.affectedRows > 0;
  },

  /**
   * Obtiene la lista de usuarios del staff (admin y supervisores)
   * que son candidatos elegibles para asignación en el calendario.
   * Devuelve únicamente datos públicos de contacto operativo.
   */
  async getStaffCandidates() {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, r.nombre AS rol
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id_rol
       WHERE LOWER(r.nombre) IN ('administrador', 'supervisor')
       ORDER BY u.nombre ASC`
    );
    return rows;
  }
};

