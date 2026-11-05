import pool from '../config/db.js';

export const UsuarioModel = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.id_rol, u.id_cliente, u.nombre, u.correo, u.fecha_creacion,
              r.nombre AS rol, r.descripcion AS descripcion_rol,
              c.nombre AS nombre_cliente, c.tipo_cliente
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN clientes c ON u.id_cliente = c.id_cliente
       ORDER BY u.id_usuario ASC`
    );
    return rows;
  },

  async findById(id_usuario) {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.id_rol, u.id_cliente, u.nombre, u.correo, u.fecha_creacion,
              r.nombre AS rol, r.descripcion AS descripcion_rol,
              c.nombre AS nombre_cliente, c.tipo_cliente
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN clientes c ON u.id_cliente = c.id_cliente
       WHERE u.id_usuario = ?`,
      [id_usuario]
    );
    return rows[0] || null;
  },

  async findByEmail(correo) {
    if (!correo) return null;
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.id_rol, u.id_cliente, u.nombre, u.correo, u.fecha_creacion,
              r.nombre AS rol,
              c.nombre AS nombre_cliente, c.tipo_cliente
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN clientes c ON u.id_cliente = c.id_cliente
       WHERE LOWER(u.correo) = LOWER(?)`,
      [correo.trim()]
    );
    return rows[0] || null;
  },

  /**
   * Método de uso exclusivo para autenticación en AuthController.
   * Devuelve el hash de la contraseña para cotejo seguro con bcrypt.
   */
  async findByEmailWithPassword(correo) {
    if (!correo) return null;
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.id_rol, u.id_cliente, u.nombre, u.correo, u.password, u.fecha_creacion,
              r.nombre AS rol,
              c.nombre AS nombre_cliente, c.tipo_cliente
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN clientes c ON u.id_cliente = c.id_cliente
       WHERE LOWER(u.correo) = LOWER(?)`,
      [correo.trim()]
    );
    return rows[0] || null;
  },

  async findByClientId(id_cliente) {
    const [rows] = await pool.query(
      'SELECT id_usuario, correo, nombre FROM usuarios WHERE id_cliente = ?',
      [id_cliente]
    );
    return rows[0] || null;
  },

  async create({ id_rol, id_cliente = null, nombre, correo, password }) {
    const [result] = await pool.query(
      `INSERT INTO usuarios (id_rol, id_cliente, nombre, correo, password)
       VALUES (?, ?, ?, ?, ?)`,
      [id_rol, id_cliente, nombre.trim(), correo.trim().toLowerCase(), password]
    );
    return this.findById(result.insertId);
  },

  async update(id_usuario, { id_rol, id_cliente, nombre, correo, password }) {
    let sql = 'UPDATE usuarios SET id_rol = ?, id_cliente = ?, nombre = ?, correo = ?';
    const params = [id_rol, id_cliente || null, nombre.trim(), correo.trim().toLowerCase()];

    if (password) {
      sql += ', password = ?';
      params.push(password);
    }

    sql += ' WHERE id_usuario = ?';
    params.push(id_usuario);

    await pool.query(sql, params);
    return this.findById(id_usuario);
  },

  async delete(id_usuario) {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id_usuario]);
    return result.affectedRows > 0;
  },

  async countAdmins() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM usuarios u
       INNER JOIN roles r ON u.id_rol = r.id_rol
       WHERE LOWER(r.nombre) = 'administrador'`
    );
    return rows[0].total;
  }
};

