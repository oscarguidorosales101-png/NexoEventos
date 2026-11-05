import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { UsuarioModel } from '../models/usuarioModel.js';
import { ClienteModel } from '../models/clienteModel.js';
import { RolModel } from '../models/rolModel.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isValidEmail, isValidPassword, CLIENT_TYPES } from '../utils/validator.js';

export const AuthController = {
  /**
   * Registro público de nuevos clientes
   * Crea simultáneamente el registro en clientes y el usuario con rol 'cliente' (id_rol = 3)
   */
  async register(req, res) {
    const connection = await pool.getConnection();
    try {
      const {
        nombre,
        correo,
        password,
        tipo_cliente = 'persona',
        telefono,
        direccion
      } = req.body;

      // 1. Validaciones de presencia y formato
      if (!nombre || !nombre.trim()) {
        return sendError(res, 400, 'El nombre completo es obligatorio');
      }

      if (!correo || !isValidEmail(correo)) {
        return sendError(res, 400, 'Debe proporcionar un correo electrónico válido');
      }

      if (!password || !isValidPassword(password)) {
        return sendError(res, 400, 'La contraseña debe tener como mínimo 8 caracteres');
      }

      if (!CLIENT_TYPES.includes(tipo_cliente)) {
        return sendError(res, 400, `El tipo de cliente debe ser uno de: ${CLIENT_TYPES.join(', ')}`);
      }

      // 2. Comprobar duplicidad de correo en usuarios
      const existingUser = await UsuarioModel.findByEmail(correo);
      if (existingUser) {
        return sendError(res, 400, 'El correo electrónico ya se encuentra registrado en el sistema');
      }

      // 3. Hashear la contraseña con bcrypt (10 rounds)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Iniciar transacción en MySQL para garantizar atomicidad
      await connection.beginTransaction();

      // Insertar en clientes
      const [clienteResult] = await connection.query(
        `INSERT INTO clientes (tipo_cliente, nombre, correo, telefono, direccion)
         VALUES (?, ?, ?, ?, ?)`,
        [tipo_cliente, nombre.trim(), correo.trim().toLowerCase(), telefono ? telefono.trim() : null, direccion ? direccion.trim() : null]
      );
      const idCliente = clienteResult.insertId;

      // Rol 'cliente' tiene id_rol = 3 (garantizado desde backend, nunca tomado de req.body)
      const ROL_CLIENTE_ID = 3;

      // Insertar en usuarios
      const [userResult] = await connection.query(
        `INSERT INTO usuarios (id_rol, id_cliente, nombre, correo, password)
         VALUES (?, ?, ?, ?, ?)`,
        [ROL_CLIENTE_ID, idCliente, nombre.trim(), correo.trim().toLowerCase(), hashedPassword]
      );
      const idUsuario = userResult.insertId;

      await connection.commit();

      const nuevoUsuario = {
        id_usuario: idUsuario,
        id_rol: ROL_CLIENTE_ID,
        rol: 'cliente',
        id_cliente: idCliente,
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        tipo_cliente
      };

      return sendSuccess(res, 201, 'Usuario y perfil de cliente registrados exitosamente', nuevoUsuario);
    } catch (error) {
      await connection.rollback();
      console.error('Error en AuthController.register:', error);
      return sendError(res, 500, 'Error al registrar el usuario en el sistema');
    } finally {
      connection.release();
    }
  },

  /**
   * Inicio de sesión para usuarios
   * Retorna token JWT y datos de perfil seguros (sin contraseñas)
   */
  async login(req, res) {
    try {
      const { correo, password } = req.body;

      if (!correo || !password) {
        return sendError(res, 400, 'Debe ingresar el correo y la contraseña');
      }

      // Buscar usuario incluyendo su contraseña para verificarla
      const user = await UsuarioModel.findByEmailWithPassword(correo);
      if (!user) {
        return sendError(res, 401, 'Credenciales incorrectas: correo o contraseña no válidos');
      }

      // Comparación con bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendError(res, 401, 'Credenciales incorrectas: correo o contraseña no válidos');
      }

      // Generar JWT
      const payload = {
        id_usuario: user.id_usuario,
        id_rol: user.id_rol,
        rol: user.rol,
        correo: user.correo,
        id_cliente: user.id_cliente
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      });

      const usuarioSeguro = {
        id_usuario: user.id_usuario,
        id_rol: user.id_rol,
        id_cliente: user.id_cliente,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        nombre_cliente: user.nombre_cliente,
        tipo_cliente: user.tipo_cliente
      };

      return sendSuccess(res, 200, 'Inicio de sesión exitoso', {
        token,
        usuario: usuarioSeguro
      });
    } catch (error) {
      console.error('Error en AuthController.login:', error);
      return sendError(res, 500, 'Error interno durante el inicio de sesión');
    }
  },

  /**
   * Obtiene la información del usuario actualmente autenticado (Perfil actual)
   */
  async getMe(req, res) {
    try {
      // req.user ya fue poblado y validado por authMiddleware
      return sendSuccess(res, 200, 'Perfil de usuario obtenido', req.user);
    } catch (error) {
      console.error('Error en AuthController.getMe:', error);
      return sendError(res, 500, 'Error al consultar el perfil');
    }
  },

  /**
   * Actualizar perfil del propio usuario autenticado
   */
  async updateProfile(req, res) {
    try {
      const { nombre, password, telefono, direccion } = req.body;
      const { id_usuario, id_cliente } = req.user;

      if (nombre && !nombre.trim()) {
        return sendError(res, 400, 'El nombre no puede ser vacío');
      }

      let hashedPassword = null;
      if (password) {
        if (!isValidPassword(password)) {
          return sendError(res, 400, 'La nueva contraseña debe tener mínimo 8 caracteres');
        }
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Actualizar datos de usuario
      const currentUser = await UsuarioModel.findById(id_usuario);
      await UsuarioModel.update(id_usuario, {
        id_rol: currentUser.id_rol,
        id_cliente: currentUser.id_cliente,
        nombre: nombre ? nombre.trim() : currentUser.nombre,
        correo: currentUser.correo,
        password: hashedPassword || null
      });

      // Si tiene cliente asociado, actualizar datos de contacto
      if (id_cliente) {
        const currentClient = await ClienteModel.findById(id_cliente);
        if (currentClient) {
          await ClienteModel.update(id_cliente, {
            tipo_cliente: currentClient.tipo_cliente,
            nombre: nombre ? nombre.trim() : currentClient.nombre,
            correo: currentClient.correo,
            telefono: telefono !== undefined ? telefono : currentClient.telefono,
            direccion: direccion !== undefined ? direccion : currentClient.direccion
          });
        }
      }

      const updatedUser = await UsuarioModel.findById(id_usuario);
      return sendSuccess(res, 200, 'Perfil actualizado correctamente', updatedUser);
    } catch (error) {
      console.error('Error en AuthController.updateProfile:', error);
      return sendError(res, 500, 'Error al actualizar el perfil');
    }
  }
};

