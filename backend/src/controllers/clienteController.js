import { ClienteModel } from '../models/clienteModel.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isValidEmail, CLIENT_TYPES } from '../utils/validator.js';

export const ClienteController = {
  /**
   * GET /api/clientes - Listar clientes
   */
  async getAll(req, res) {
    try {
      // Si el usuario es rol 'cliente', solo ve su propio perfil de cliente
      if (req.user.rol === 'cliente') {
        if (!req.user.id_cliente) {
          return sendSuccess(res, 200, 'Listado de clientes', []);
        }
        const miCliente = await ClienteModel.findById(req.user.id_cliente);
        return sendSuccess(res, 200, 'Información de su perfil de cliente', miCliente ? [miCliente] : []);
      }

      // Administradores y Supervisores ven todos
      const clientes = await ClienteModel.findAll();
      return sendSuccess(res, 200, 'Listado de clientes obtenido', clientes);
    } catch (error) {
      console.error('Error en ClienteController.getAll:', error);
      return sendError(res, 500, 'Error al obtener clientes');
    }
  },

  /**
   * GET /api/clientes/:id - Consultar un cliente por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      // Restricción para rol cliente: solo puede consultar su propio ID
      if (req.user.rol === 'cliente' && Number(req.user.id_cliente) !== Number(id)) {
        return sendError(res, 403, 'Acceso denegado: No tiene permisos para consultar información de otros clientes');
      }

      const cliente = await ClienteModel.findById(id);
      if (!cliente) {
        return sendError(res, 404, `Cliente con ID ${id} no encontrado`);
      }

      return sendSuccess(res, 200, 'Cliente encontrado', cliente);
    } catch (error) {
      console.error('Error en ClienteController.getById:', error);
      return sendError(res, 500, 'Error al obtener cliente');
    }
  },

  /**
   * POST /api/clientes - Crear nuevo cliente
   */
  async create(req, res) {
    try {
      // Solo administrador y supervisor pueden crear clientes administrativamente
      if (req.user.rol === 'cliente') {
        return sendError(res, 403, 'Acceso denegado: Los clientes no pueden crear otros perfiles');
      }

      const { tipo_cliente, nombre, correo, telefono, direccion } = req.body;

      if (!tipo_cliente || !CLIENT_TYPES.includes(tipo_cliente)) {
        return sendError(res, 400, `El tipo de cliente es obligatorio y debe ser: ${CLIENT_TYPES.join(', ')}`);
      }

      if (!nombre || !nombre.trim()) {
        return sendError(res, 400, 'El nombre del cliente es obligatorio');
      }

      if (correo && !isValidEmail(correo)) {
        return sendError(res, 400, 'El formato del correo electrónico es inválido');
      }

      const nuevoCliente = await ClienteModel.create({
        tipo_cliente,
        nombre,
        correo,
        telefono,
        direccion
      });

      return sendSuccess(res, 201, 'Cliente creado exitosamente', nuevoCliente);
    } catch (error) {
      console.error('Error en ClienteController.create:', error);
      return sendError(res, 500, 'Error al registrar cliente');
    }
  },

  /**
   * PUT /api/clientes/:id - Actualizar cliente existente
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      // Verificación de propiedad para clientes
      if (req.user.rol === 'cliente' && Number(req.user.id_cliente) !== Number(id)) {
        return sendError(res, 403, 'Acceso denegado: No puede modificar datos de otros clientes');
      }

      const clienteExistente = await ClienteModel.findById(id);
      if (!clienteExistente) {
        return sendError(res, 404, `Cliente con ID ${id} no encontrado`);
      }

      const { tipo_cliente, nombre, correo, telefono, direccion } = req.body;

      const finalTipo = tipo_cliente || clienteExistente.tipo_cliente;
      if (!CLIENT_TYPES.includes(finalTipo)) {
        return sendError(res, 400, `Tipo de cliente no válido. Permitidos: ${CLIENT_TYPES.join(', ')}`);
      }

      const finalNombre = nombre ? nombre.trim() : clienteExistente.nombre;
      if (!finalNombre) {
        return sendError(res, 400, 'El nombre no puede quedar vacío');
      }

      const finalCorreo = correo !== undefined ? correo : clienteExistente.correo;
      if (finalCorreo && !isValidEmail(finalCorreo)) {
        return sendError(res, 400, 'El formato de correo es inválido');
      }

      const clienteActualizado = await ClienteModel.update(id, {
        tipo_cliente: finalTipo,
        nombre: finalNombre,
        correo: finalCorreo,
        telefono: telefono !== undefined ? telefono : clienteExistente.telefono,
        direccion: direccion !== undefined ? direccion : clienteExistente.direccion
      });

      return sendSuccess(res, 200, 'Cliente actualizado correctamente', clienteActualizado);
    } catch (error) {
      console.error('Error en ClienteController.update:', error);
      return sendError(res, 500, 'Error al actualizar cliente');
    }
  },

  /**
   * DELETE /api/clientes/:id - Eliminar cliente
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (req.user.rol === 'cliente') {
        return sendError(res, 403, 'Acceso denegado: Los clientes no pueden eliminar cuentas');
      }

      const cliente = await ClienteModel.findById(id);
      if (!cliente) {
        return sendError(res, 404, `Cliente con ID ${id} no encontrado`);
      }

      // Comprobar dependencias: eventos asociados
      const totalEventos = await ClienteModel.countEvents(id);
      if (totalEventos > 0) {
        return sendError(
          res,
          409,
          `No se puede eliminar el cliente porque tiene ${totalEventos} evento(s) asociado(s). Elimine o reasigne los eventos primero.`
        );
      }

      // Comprobar dependencias: usuario asociado
      const totalUsuarios = await ClienteModel.countUsers(id);
      if (totalUsuarios > 0) {
        return sendError(
          res,
          409,
          `No se puede eliminar el cliente porque tiene ${totalUsuarios} cuenta(s) de usuario vinculada(s).`
        );
      }

      await ClienteModel.delete(id);
      return sendSuccess(res, 200, `Cliente con ID ${id} eliminado correctamente`);
    } catch (error) {
      console.error('Error en ClienteController.delete:', error);
      return sendError(res, 500, 'Error al eliminar cliente');
    }
  }
};

