import { RolModel } from '../models/rolModel.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const RolController = {
  /**
   * GET /api/roles - Listar todos los roles
   */
  async getAll(req, res) {
    try {
      const roles = await RolModel.findAll();
      return sendSuccess(res, 200, 'Listado de roles obtenido', roles);
    } catch (error) {
      console.error('Error en RolController.getAll:', error);
      return sendError(res, 500, 'Error al obtener roles');
    }
  },

  /**
   * GET /api/roles/:id - Consultar un rol por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const rol = await RolModel.findById(id);
      if (!rol) {
        return sendError(res, 404, `Rol con ID ${id} no encontrado`);
      }
      return sendSuccess(res, 200, 'Rol encontrado', rol);
    } catch (error) {
      console.error('Error en RolController.getById:', error);
      return sendError(res, 500, 'Error al obtener rol');
    }
  },

  /**
   * POST /api/roles - Crear nuevo rol
   * Respetando el catálogo fijo de 3 roles esenciales ('administrador', 'supervisor', 'cliente')
   */
  async create(req, res) {
    try {
      const { nombre, descripcion } = req.body;
      if (!nombre || !nombre.trim()) {
        return sendError(res, 400, 'El nombre del rol es obligatorio');
      }

      // Regla de catálogo fijo: el sistema solo admite los 3 roles funcionales estándar
      const normalizedName = nombre.trim().toLowerCase();
      if (!['administrador', 'supervisor', 'cliente'].includes(normalizedName)) {
        return sendError(
          res,
          409,
          'Operación no permitida: NexoEventos opera bajo un catálogo cerrado de roles funcionales (administrador, supervisor, cliente). No se permite crear roles funcionales adicionales.'
        );
      }

      const existing = await RolModel.findByName(normalizedName);
      if (existing) {
        return sendError(res, 409, `El rol '${nombre}' ya existe en el sistema`);
      }

      const nuevoRol = await RolModel.create({ nombre: normalizedName, descripcion });
      return sendSuccess(res, 201, 'Rol creado exitosamente', nuevoRol);
    } catch (error) {
      console.error('Error en RolController.create:', error);
      return sendError(res, 500, 'Error al registrar rol');
    }
  },

  /**
   * PUT /api/roles/:id - Actualizar rol
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;

      const rol = await RolModel.findById(id);
      if (!rol) {
        return sendError(res, 404, `Rol con ID ${id} no encontrado`);
      }

      // Proteger los nombres esenciales de los tres roles fijos
      if (nombre && nombre.trim().toLowerCase() !== rol.nombre.toLowerCase()) {
        return sendError(
          res,
          409,
          'Operación no permitida: No se pueden renombrar los identificadores de los roles del sistema base (administrador, supervisor, cliente).'
        );
      }

      const rolActualizado = await RolModel.update(id, {
        nombre: rol.nombre,
        descripcion: descripcion !== undefined ? descripcion : rol.descripcion
      });

      return sendSuccess(res, 200, 'Rol actualizado correctamente', rolActualizado);
    } catch (error) {
      console.error('Error en RolController.update:', error);
      return sendError(res, 500, 'Error al actualizar rol');
    }
  },

  /**
   * DELETE /api/roles/:id - Eliminar rol
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const rol = await RolModel.findById(id);
      if (!rol) {
        return sendError(res, 404, `Rol con ID ${id} no encontrado`);
      }

      // Proteger los tres roles iniciales del sistema
      if ([1, 2, 3].includes(Number(id)) || ['administrador', 'supervisor', 'cliente'].includes(rol.nombre.toLowerCase())) {
        return sendError(
          res,
          409,
          'Conflicto de integridad: Los tres roles estructurales del sistema (administrador, supervisor, cliente) son protegidos y no pueden eliminarse.'
        );
      }

      const usersCount = await RolModel.countUsersWithRole(id);
      if (usersCount > 0) {
        return sendError(
          res,
          409,
          `No se puede eliminar el rol porque existen ${usersCount} usuarios asignados a él`
        );
      }

      await RolModel.delete(id);
      return sendSuccess(res, 200, `Rol con ID ${id} eliminado correctamente`);
    } catch (error) {
      console.error('Error en RolController.delete:', error);
      return sendError(res, 500, 'Error al eliminar rol');
    }
  }
};

