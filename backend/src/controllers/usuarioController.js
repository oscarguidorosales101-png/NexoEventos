import bcrypt from 'bcryptjs';
import { UsuarioModel } from '../models/usuarioModel.js';
import { RolModel } from '../models/rolModel.js';
import { ClienteModel } from '../models/clienteModel.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isValidEmail, isValidPassword } from '../utils/validator.js';

export const UsuarioController = {
  /**
   * GET /api/usuarios - Listar todos los usuarios
   * Permitido para Administrador y Supervisor
   */
  async getAll(req, res) {
    try {
      const usuarios = await UsuarioModel.findAll();
      return sendSuccess(res, 200, 'Listado de usuarios obtenido', usuarios);
    } catch (error) {
      console.error('Error en UsuarioController.getAll:', error);
      return sendError(res, 500, 'Error al obtener usuarios');
    }
  },

  /**
   * GET /api/usuarios/:id - Consultar usuario por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const usuario = await UsuarioModel.findById(id);

      if (!usuario) {
        return sendError(res, 404, `Usuario con ID ${id} no encontrado`);
      }

      return sendSuccess(res, 200, 'Usuario encontrado', usuario);
    } catch (error) {
      console.error('Error en UsuarioController.getById:', error);
      return sendError(res, 500, 'Error al obtener usuario');
    }
  },

  /**
   * POST /api/usuarios - Crear usuario administrativamente
   * Exclusivo para Administrador
   */
  async create(req, res) {
    try {
      if (req.user.rol !== 'administrador') {
        return sendError(res, 403, 'Acceso denegado: Solo el Administrador puede registrar nuevos usuarios');
      }

      const { id_rol, id_cliente, nombre, correo, password } = req.body;

      if (!nombre || !nombre.trim()) {
        return sendError(res, 400, 'El nombre completo es obligatorio');
      }

      if (!correo || !isValidEmail(correo)) {
        return sendError(res, 400, 'Debe proporcionar un correo electrónico válido');
      }

      if (!password || !isValidPassword(password)) {
        return sendError(res, 400, 'La contraseña debe tener al menos 8 caracteres');
      }

      if (!id_rol) {
        return sendError(res, 400, 'Debe asignar un rol válido al usuario');
      }

      // Validar existencia del rol
      const rolExistente = await RolModel.findById(id_rol);
      if (!rolExistente) {
        return sendError(res, 404, `El rol referenciado con ID ${id_rol} no existe`);
      }

      // Si el rol es cliente (id_rol = 3), id_cliente es obligatorio
      if (Number(id_rol) === 3) {
        if (!id_cliente) {
          return sendError(res, 400, 'Los usuarios con rol cliente deben estar vinculados a un cliente (id_cliente)');
        }
        const clienteExistente = await ClienteModel.findById(id_cliente);
        if (!clienteExistente) {
          return sendError(res, 404, `El cliente referenciado con ID ${id_cliente} no existe`);
        }

        // Verificar que no esté ya asociado a otro usuario
        const usuarioAsociado = await UsuarioModel.findByClientId(id_cliente);
        if (usuarioAsociado) {
          return sendError(res, 409, `El cliente con ID ${id_cliente} ya tiene asignada una cuenta de usuario`);
        }
      }

      // Validar unicidad del correo
      const usuarioDuplicado = await UsuarioModel.findByEmail(correo);
      if (usuarioDuplicado) {
        return sendError(res, 400, 'El correo electrónico ya está registrado');
      }

      // Hashear contraseña con bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const nuevoUsuario = await UsuarioModel.create({
        id_rol: Number(id_rol),
        id_cliente: id_cliente ? Number(id_cliente) : null,
        nombre,
        correo,
        password: hashedPassword
      });

      return sendSuccess(res, 201, 'Usuario creado exitosamente', nuevoUsuario);
    } catch (error) {
      console.error('Error en UsuarioController.create:', error);
      return sendError(res, 500, 'Error al registrar usuario');
    }
  },

  /**
   * PUT /api/usuarios/:id - Actualizar usuario
   * Exclusivo para Administrador
   */
  async update(req, res) {
    try {
      if (req.user.rol !== 'administrador') {
        return sendError(res, 403, 'Acceso denegado: Solo el Administrador puede modificar cuentas de usuario');
      }

      const { id } = req.params;
      const usuarioExistente = await UsuarioModel.findById(id);

      if (!usuarioExistente) {
        return sendError(res, 404, `Usuario con ID ${id} no encontrado`);
      }

      const { id_rol, id_cliente, nombre, correo, password } = req.body;

      const finalRolId = id_rol !== undefined ? Number(id_rol) : usuarioExistente.id_rol;

      // REGLA CRÍTICA: Proteger al último administrador activo contra degradación
      if (usuarioExistente.rol === 'administrador' && finalRolId !== usuarioExistente.id_rol) {
        const totalAdmins = await UsuarioModel.countAdmins();
        if (totalAdmins <= 1) {
          return sendError(
            res,
            409,
            'Operación bloqueada por seguridad: No se puede cambiar el rol del único administrador del sistema'
          );
        }
      }

      // Validar si el nuevo rol existe
      if (id_rol !== undefined) {
        const rol = await RolModel.findById(finalRolId);
        if (!rol) {
          return sendError(res, 404, `El rol con ID ${finalRolId} no existe`);
        }
      }

      // Si el rol final es cliente (3), validar id_cliente
      let finalClienteId = id_cliente !== undefined ? (id_cliente ? Number(id_cliente) : null) : usuarioExistente.id_cliente;
      if (finalRolId === 3) {
        if (!finalClienteId) {
          return sendError(res, 400, 'Los usuarios con rol cliente requieren un id_cliente asociado');
        }
        const cliente = await ClienteModel.findById(finalClienteId);
        if (!cliente) {
          return sendError(res, 404, `El cliente con ID ${finalClienteId} no existe`);
        }
      } else {
        // Usuarios administrativos no requieren id_cliente
        finalClienteId = null;
      }

      const finalNombre = nombre ? nombre.trim() : usuarioExistente.nombre;
      const finalCorreo = correo ? correo.trim().toLowerCase() : usuarioExistente.correo;

      if (correo && !isValidEmail(finalCorreo)) {
        return sendError(res, 400, 'El formato de correo es inválido');
      }

      // Si cambió el correo, verificar duplicidad
      if (finalCorreo !== usuarioExistente.correo.toLowerCase()) {
        const duplicado = await UsuarioModel.findByEmail(finalCorreo);
        if (duplicado) {
          return sendError(res, 400, 'El correo electrónico ya está en uso por otra cuenta');
        }
      }

      let hashedPassword = null;
      if (password) {
        if (!isValidPassword(password)) {
          return sendError(res, 400, 'La contraseña debe tener mínimo 8 caracteres');
        }
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }

      const usuarioActualizado = await UsuarioModel.update(id, {
        id_rol: finalRolId,
        id_cliente: finalClienteId,
        nombre: finalNombre,
        correo: finalCorreo,
        password: hashedPassword
      });

      return sendSuccess(res, 200, 'Usuario actualizado correctamente', usuarioActualizado);
    } catch (error) {
      console.error('Error en UsuarioController.update:', error);
      return sendError(res, 500, 'Error al actualizar usuario');
    }
  },

  /**
   * DELETE /api/usuarios/:id - Eliminar usuario
   * Exclusivo para Administrador
   */
  async delete(req, res) {
    try {
      if (req.user.rol !== 'administrador') {
        return sendError(res, 403, 'Acceso denegado: Solo el Administrador puede eliminar usuarios');
      }

      const { id } = req.params;
      const usuario = await UsuarioModel.findById(id);

      if (!usuario) {
        return sendError(res, 404, `Usuario con ID ${id} no encontrado`);
      }

      // REGLA CRÍTICA: Proteger al último administrador contra eliminación
      if (usuario.rol === 'administrador') {
        const totalAdmins = await UsuarioModel.countAdmins();
        if (totalAdmins <= 1) {
          return sendError(
            res,
            409,
            'Operación bloqueada por seguridad: No se puede eliminar el único administrador activo del sistema'
          );
        }
      }

      await UsuarioModel.delete(id);
      return sendSuccess(res, 200, `Usuario con ID ${id} eliminado correctamente`);
    } catch (error) {
      console.error('Error en UsuarioController.delete:', error);
      return sendError(res, 500, 'Error al eliminar usuario');
    }
  }
};

