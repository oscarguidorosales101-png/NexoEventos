import { EventoModel } from '../models/eventoModel.js';
import { ClienteModel } from '../models/clienteModel.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isValidDate, EVENT_STATUSES } from '../utils/validator.js';

export const EventoController = {
  /**
   * GET /api/eventos - Listar eventos
   */
  async getAll(req, res) {
    try {
      const isClient = req.user && req.user.rol === 'cliente';
      const idCliente = isClient ? req.user.id_cliente : null;

      if (isClient && !idCliente) {
        return sendSuccess(res, 200, 'Listado de eventos', []);
      }

      const eventos = await EventoModel.findAll({ id_cliente: idCliente });
      return sendSuccess(res, 200, 'Listado de eventos obtenido', eventos);
    } catch (error) {
      console.error('Error en EventoController.getAll:', error);
      return sendError(res, 500, 'Error al obtener eventos');
    }
  },

  /**
   * GET /api/eventos/:id - Consultar evento por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const evento = await EventoModel.findById(id);

      if (!evento) {
        return sendError(res, 404, `Evento con ID ${id} no encontrado`);
      }

      // Restricción de propiedad para clientes
      if (req.user.rol === 'cliente' && Number(evento.id_cliente) !== Number(req.user.id_cliente)) {
        return sendError(res, 403, 'Acceso denegado: No tiene permisos para consultar eventos de otros clientes');
      }

      return sendSuccess(res, 200, 'Evento encontrado', evento);
    } catch (error) {
      console.error('Error en EventoController.getById:', error);
      return sendError(res, 500, 'Error al obtener evento');
    }
  },

  /**
   * POST /api/eventos - Crear nuevo evento / solicitud
   */
  async create(req, res) {
    try {
      const { nombre, tipo_evento, fecha_evento, ubicacion } = req.body;
      let { id_cliente, estado } = req.body;

      // Seguridad: Si es cliente, el id_cliente SIEMPRE se toma de la sesión autenticada
      if (req.user.rol === 'cliente') {
        if (!req.user.id_cliente) {
          return sendError(res, 400, 'Su cuenta de usuario no tiene un perfil de cliente asociado');
        }
        id_cliente = req.user.id_cliente;
        estado = 'pendiente'; // Los clientes solo pueden crear solicitudes pendientes
      } else {
        // Administrador o supervisor deben especificar un id_cliente válido
        if (!id_cliente) {
          return sendError(res, 400, 'El campo id_cliente es obligatorio');
        }
        estado = estado || 'pendiente';
      }

      // Validar existencia de la clave foránea en clientes
      const clienteExistente = await ClienteModel.findById(id_cliente);
      if (!clienteExistente) {
        return sendError(res, 404, `El cliente referenciado con ID ${id_cliente} no existe`);
      }

      // Validaciones de campos
      if (!nombre || !nombre.trim()) {
        return sendError(res, 400, 'El nombre del evento es obligatorio');
      }

      if (!tipo_evento || !tipo_evento.trim()) {
        return sendError(res, 400, 'El tipo de evento es obligatorio (ej. Boda, Corporativo, Aniversario)');
      }

      if (!fecha_evento || !isValidDate(fecha_evento)) {
        return sendError(res, 400, 'Debe especificar una fecha de evento válida (YYYY-MM-DD)');
      }

      if (!ubicacion || !ubicacion.trim()) {
        return sendError(res, 400, 'La ubicación del evento es obligatoria');
      }

      if (!EVENT_STATUSES.includes(estado)) {
        return sendError(res, 400, `Estado no válido. Permitidos: ${EVENT_STATUSES.join(', ')}`);
      }

      const nuevoEvento = await EventoModel.create({
        id_cliente,
        nombre,
        tipo_evento,
        fecha_evento,
        ubicacion,
        estado
      });

      return sendSuccess(res, 201, 'Evento registrado exitosamente', nuevoEvento);
    } catch (error) {
      console.error('Error en EventoController.create:', error);
      return sendError(res, 500, 'Error al registrar evento');
    }
  },

  /**
   * PUT /api/eventos/:id - Actualizar evento
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const eventoExistente = await EventoModel.findById(id);

      if (!eventoExistente) {
        return sendError(res, 404, `Evento con ID ${id} no encontrado`);
      }

      // Restricción de propiedad
      if (req.user.rol === 'cliente') {
        if (Number(eventoExistente.id_cliente) !== Number(req.user.id_cliente)) {
          return sendError(res, 403, 'Acceso denegado: No puede modificar eventos de otros clientes');
        }
      }

      const { nombre, tipo_evento, fecha_evento, ubicacion } = req.body;
      let { id_cliente, estado } = req.body;

      // Si es cliente, no puede transferir el evento a otro cliente ni auto-aprobarse
      if (req.user.rol === 'cliente') {
        id_cliente = eventoExistente.id_cliente;
        // Solo puede mantener el estado o cancelar su solicitud
        if (estado && estado !== 'cancelado' && estado !== eventoExistente.estado) {
          return sendError(res, 403, 'Los clientes no pueden modificar el estado administrativo del evento directamente (solo cancelarlo)');
        }
        estado = estado || eventoExistente.estado;
      } else {
        id_cliente = id_cliente || eventoExistente.id_cliente;
        estado = estado || eventoExistente.estado;

        // Si se cambia el id_cliente, verificar que el nuevo cliente exista
        if (Number(id_cliente) !== Number(eventoExistente.id_cliente)) {
          const cliente = await ClienteModel.findById(id_cliente);
          if (!cliente) {
            return sendError(res, 404, `El nuevo cliente con ID ${id_cliente} no existe`);
          }
        }
      }

      if (!EVENT_STATUSES.includes(estado)) {
        return sendError(res, 400, `Estado no válido. Permitidos: ${EVENT_STATUSES.join(', ')}`);
      }

      const finalNombre = nombre ? nombre.trim() : eventoExistente.nombre;
      const finalTipo = tipo_evento ? tipo_evento.trim() : eventoExistente.tipo_evento;
      const finalFecha = fecha_evento || eventoExistente.fecha_evento;
      const finalUbicacion = ubicacion ? ubicacion.trim() : eventoExistente.ubicacion;

      if (fecha_evento && !isValidDate(fecha_evento)) {
        return sendError(res, 400, 'La fecha del evento debe ser una fecha válida');
      }

      const eventoActualizado = await EventoModel.update(id, {
        id_cliente,
        nombre: finalNombre,
        tipo_evento: finalTipo,
        fecha_evento: finalFecha,
        ubicacion: finalUbicacion,
        estado
      });

      return sendSuccess(res, 200, 'Evento actualizado correctamente', eventoActualizado);
    } catch (error) {
      console.error('Error en EventoController.update:', error);
      return sendError(res, 500, 'Error al actualizar evento');
    }
  },

  /**
   * DELETE /api/eventos/:id - Eliminar evento
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (req.user.rol === 'cliente') {
        return sendError(res, 403, 'Acceso denegado: Los clientes no tienen permisos para eliminar registros de eventos');
      }

      const evento = await EventoModel.findById(id);
      if (!evento) {
        return sendError(res, 404, `Evento con ID ${id} no encontrado`);
      }

      // Comprobar detalles dependientes
      const totalDetalles = await EventoModel.countDetalles(id);
      if (totalDetalles > 0) {
        return sendError(
          res,
          409,
          `No se puede eliminar el evento porque tiene ${totalDetalles} servicio(s) desglosado(s) en su detalle. Elimine los detalles de evento primero.`
        );
      }

      await EventoModel.delete(id);
      return sendSuccess(res, 200, `Evento con ID ${id} eliminado correctamente`);
    } catch (error) {
      console.error('Error en EventoController.delete:', error);
      return sendError(res, 500, 'Error al eliminar evento');
    }
  }
};

