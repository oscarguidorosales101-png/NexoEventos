import { DetalleEventoModel } from '../models/detalleEventoModel.js';
import { EventoModel } from '../models/eventoModel.js';
import { ServicioModel } from '../models/servicioModel.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isPositiveInteger, isNonNegativeNumber } from '../utils/validator.js';

export const DetalleEventoController = {
  /**
   * GET /api/detalle-eventos - Listar detalles
   * Permite filtrar por ?id_evento=
   */
  async getAll(req, res) {
    try {
      const { id_evento } = req.query;
      const isClient = req.user && req.user.rol === 'cliente';
      const idCliente = isClient ? req.user.id_cliente : null;

      // Si se filtra por id_evento, verificar pertenencia si es cliente
      if (id_evento && isClient) {
        const evento = await EventoModel.findById(id_evento);
        if (!evento || Number(evento.id_cliente) !== Number(idCliente)) {
          return sendError(res, 403, 'Acceso denegado: No tiene permisos para ver detalles de este evento');
        }
      }

      const detalles = await DetalleEventoModel.findAll({
        id_evento: id_evento ? Number(id_evento) : null,
        id_cliente: idCliente
      });

      return sendSuccess(res, 200, 'Detalles de evento obtenidos', detalles);
    } catch (error) {
      console.error('Error en DetalleEventoController.getAll:', error);
      return sendError(res, 500, 'Error al obtener detalles de evento');
    }
  },

  /**
   * GET /api/detalle-eventos/:id - Consultar un detalle por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const detalle = await DetalleEventoModel.findById(id);

      if (!detalle) {
        return sendError(res, 404, `Detalle de evento con ID ${id} no encontrado`);
      }

      // Restricción de propiedad para clientes
      if (req.user.rol === 'cliente' && Number(detalle.id_cliente) !== Number(req.user.id_cliente)) {
        return sendError(res, 403, 'Acceso denegado: No tiene permisos para consultar este detalle');
      }

      return sendSuccess(res, 200, 'Detalle de evento encontrado', detalle);
    } catch (error) {
      console.error('Error en DetalleEventoController.getById:', error);
      return sendError(res, 500, 'Error al obtener detalle de evento');
    }
  },

  /**
   * POST /api/detalle-eventos - Asociar servicio a evento
   */
  async create(req, res) {
    try {
      const { id_evento, id_servicio, cantidad } = req.body;
      let { precio_unitario } = req.body;

      if (!id_evento) {
        return sendError(res, 400, 'El campo id_evento es obligatorio');
      }

      if (!id_servicio) {
        return sendError(res, 400, 'El campo id_servicio es obligatorio');
      }

      if (cantidad === undefined || !isPositiveInteger(cantidad)) {
        return sendError(res, 400, 'La cantidad debe ser un número entero mayor a 0');
      }

      // 1. Validar que el evento referenciado exista
      const evento = await EventoModel.findById(id_evento);
      if (!evento) {
        return sendError(res, 404, `El evento referenciado con ID ${id_evento} no existe`);
      }

      // Si es cliente, verificar que el evento le pertenezca
      if (req.user.rol === 'cliente') {
        if (Number(evento.id_cliente) !== Number(req.user.id_cliente)) {
          return sendError(res, 403, 'Acceso denegado: No puede agregar servicios a eventos de otros clientes');
        }
        if (evento.estado !== 'pendiente') {
          return sendError(res, 400, 'Solo puede agregar servicios a solicitudes de eventos en estado pendiente');
        }
      }

      // 2. Validar que el servicio referenciado exista
      const servicio = await ServicioModel.findById(id_servicio);
      if (!servicio) {
        return sendError(res, 404, `El servicio referenciado con ID ${id_servicio} no existe`);
      }

      // Si es cliente, no permitir servicios inactivos
      if (req.user.rol === 'cliente' && servicio.estado !== 'activo') {
        return sendError(res, 400, 'El servicio seleccionado no se encuentra activo actualmente');
      }

      // 3. Determinar precio_unitario pactado
      if (precio_unitario === undefined || precio_unitario === null || precio_unitario === '') {
        // Por defecto se toma el precio de catálogo actual del servicio
        precio_unitario = Number(servicio.precio);
      } else {
        if (!isNonNegativeNumber(precio_unitario)) {
          return sendError(res, 400, 'El precio unitario debe ser un número mayor o igual a 0');
        }
        // Si es cliente, no se le permite alterar el precio arbitrariamente
        if (req.user.rol === 'cliente') {
          precio_unitario = Number(servicio.precio);
        } else {
          precio_unitario = Number(precio_unitario);
        }
      }

      const nuevoDetalle = await DetalleEventoModel.create({
        id_evento: Number(id_evento),
        id_servicio: Number(id_servicio),
        cantidad: Number(cantidad),
        precio_unitario
      });

      return sendSuccess(res, 201, 'Servicio agregado al evento exitosamente', nuevoDetalle);
    } catch (error) {
      console.error('Error en DetalleEventoController.create:', error);
      return sendError(res, 500, 'Error al agregar servicio al evento');
    }
  },

  /**
   * PUT /api/detalle-eventos/:id - Actualizar detalle
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const detalleExistente = await DetalleEventoModel.findById(id);

      if (!detalleExistente) {
        return sendError(res, 404, `Detalle de evento con ID ${id} no encontrado`);
      }

      // Restricción de propiedad
      if (req.user.rol === 'cliente') {
        if (Number(detalleExistente.id_cliente) !== Number(req.user.id_cliente)) {
          return sendError(res, 403, 'Acceso denegado: No puede modificar detalles de eventos de otros clientes');
        }
      }

      const { cantidad, precio_unitario, id_evento, id_servicio } = req.body;

      const finalEventoId = id_evento ? Number(id_evento) : detalleExistente.id_evento;
      const finalServicioId = id_servicio ? Number(id_servicio) : detalleExistente.id_servicio;

      // Si cambió el evento o servicio, verificar existencias
      if (finalEventoId !== detalleExistente.id_evento) {
        const evento = await EventoModel.findById(finalEventoId);
        if (!evento) return sendError(res, 404, `El evento con ID ${finalEventoId} no existe`);
      }

      if (finalServicioId !== detalleExistente.id_servicio) {
        const servicio = await ServicioModel.findById(finalServicioId);
        if (!servicio) return sendError(res, 404, `El servicio con ID ${finalServicioId} no existe`);
      }

      const finalCantidad = cantidad !== undefined ? Number(cantidad) : detalleExistente.cantidad;
      if (!isPositiveInteger(finalCantidad)) {
        return sendError(res, 400, 'La cantidad debe ser un entero positivo mayor a 0');
      }

      let finalPrecio = precio_unitario !== undefined ? Number(precio_unitario) : Number(detalleExistente.precio_unitario);
      if (req.user.rol === 'cliente') {
        finalPrecio = Number(detalleExistente.precio_unitario); // Cliente no altera precio
      } else if (!isNonNegativeNumber(finalPrecio)) {
        return sendError(res, 400, 'El precio unitario no puede ser negativo');
      }

      const detalleActualizado = await DetalleEventoModel.update(id, {
        id_evento: finalEventoId,
        id_servicio: finalServicioId,
        cantidad: finalCantidad,
        precio_unitario: finalPrecio
      });

      return sendSuccess(res, 200, 'Detalle de evento actualizado correctamente', detalleActualizado);
    } catch (error) {
      console.error('Error en DetalleEventoController.update:', error);
      return sendError(res, 500, 'Error al actualizar detalle de evento');
    }
  },

  /**
   * DELETE /api/detalle-eventos/:id - Eliminar detalle de evento
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const detalle = await DetalleEventoModel.findById(id);

      if (!detalle) {
        return sendError(res, 404, `Detalle de evento con ID ${id} no encontrado`);
      }

      // Restricción de propiedad
      if (req.user.rol === 'cliente') {
        if (Number(detalle.id_cliente) !== Number(req.user.id_cliente)) {
          return sendError(res, 403, 'Acceso denegado: No puede eliminar detalles de eventos de otros clientes');
        }
      }

      await DetalleEventoModel.delete(id);
      return sendSuccess(res, 200, `Detalle de evento con ID ${id} eliminado correctamente`);
    } catch (error) {
      console.error('Error en DetalleEventoController.delete:', error);
      return sendError(res, 500, 'Error al eliminar detalle de evento');
    }
  }
};

