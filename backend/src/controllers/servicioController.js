import { ServicioModel } from '../models/servicioModel.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isNonNegativeNumber, SERVICE_STATUSES } from '../utils/validator.js';

export const ServicioController = {
  /**
   * GET /api/servicios - Listar servicios
   * Los clientes solo pueden ver servicios activos
   */
  async getAll(req, res) {
    try {
      const isClient = req.user && req.user.rol === 'cliente';
      const servicios = await ServicioModel.findAll({ onlyActive: isClient });
      return sendSuccess(res, 200, 'Listado de servicios obtenido', servicios);
    } catch (error) {
      console.error('Error en ServicioController.getAll:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/servicios/:id - Consultar servicio por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const servicio = await ServicioModel.findById(id);

      if (!servicio) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      // Si es cliente y el servicio está inactivo, no permitir consulta
      if (req.user && req.user.rol === 'cliente' && servicio.estado === 'inactivo') {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      return sendSuccess(res, 200, 'Servicio encontrado', servicio);
    } catch (error) {
      console.error('Error en ServicioController.getById:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * POST /api/servicios - Crear nuevo servicio
   */
  async create(req, res) {
    try {
      if (req.user.rol === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { nombre, descripcion, precio, estado = 'activo' } = req.body;

      if (!nombre || !nombre.trim()) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'nombre', reason: 'El nombre del servicio es obligatorio' });
      }

      if (precio === undefined || !isNonNegativeNumber(precio)) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'precio', reason: 'El precio debe ser un número mayor o igual a 0' });
      }

      if (!SERVICE_STATUSES.includes(estado)) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'estado', reason: `El estado debe ser: ${SERVICE_STATUSES.join(', ')}` });
      }

      const nuevoServicio = await ServicioModel.create({
        nombre,
        descripcion,
        precio,
        estado
      });

      return sendSuccess(res, 201, 'Servicio creado exitosamente', nuevoServicio);
    } catch (error) {
      console.error('Error en ServicioController.create:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * PUT /api/servicios/:id - Actualizar servicio
   */
  async update(req, res) {
    try {
      if (req.user.rol === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const servicioExistente = await ServicioModel.findById(id);

      if (!servicioExistente) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      const { nombre, descripcion, precio, estado } = req.body;

      const finalNombre = nombre ? nombre.trim() : servicioExistente.nombre;
      if (!finalNombre) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'nombre', reason: 'El nombre no puede quedar vacío' });
      }

      const finalPrecio = precio !== undefined ? Number(precio) : Number(servicioExistente.precio);
      if (!isNonNegativeNumber(finalPrecio)) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'precio', reason: 'El precio debe ser un número mayor o igual a 0' });
      }

      const finalEstado = estado || servicioExistente.estado;
      if (!SERVICE_STATUSES.includes(finalEstado)) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'estado', reason: `Estado no válido. Permitidos: ${SERVICE_STATUSES.join(', ')}` });
      }

      const servicioActualizado = await ServicioModel.update(id, {
        nombre: finalNombre,
        descripcion: descripcion !== undefined ? descripcion : servicioExistente.descripcion,
        precio: finalPrecio,
        estado: finalEstado
      });

      return sendSuccess(res, 200, 'Servicio actualizado correctamente', servicioActualizado);
    } catch (error) {
      console.error('Error en ServicioController.update:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * DELETE /api/servicios/:id - Eliminar servicio
   */
  async delete(req, res) {
    try {
      if (req.user.rol === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const servicio = await ServicioModel.findById(id);

      if (!servicio) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      // Comprobar dependencias en detalle_eventos
      const totalDetalles = await ServicioModel.countDetalleEvents(id);
      if (totalDetalles > 0) {
        return sendError(
          res,
          409,
          'No se puede completar la operación porque existe una dependencia o conflicto.',
          'CONFLICT',
          { reason: `El servicio está contratado en ${totalDetalles} detalle(s) de evento.` }
        );
      }

      await ServicioModel.delete(id);
      return sendSuccess(res, 200, `Servicio con ID ${id} eliminado correctamente`);
    } catch (error) {
      console.error('Error en ServicioController.delete:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  }
};
