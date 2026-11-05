import { AgendaModel } from '../models/agendaModel.js';
import { CategoriaAgendaModel } from '../models/categoriaAgendaModel.js';
import { AgendaIntegrantesModel } from '../models/agendaIntegrantesModel.js';
import { AgendaNotasModel } from '../models/agendaNotasModel.js';
import { EventoModel } from '../models/eventoModel.js';
import { UsuarioModel } from '../models/usuarioModel.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateICS } from '../utils/icsExporter.js';
import {
  broadcastScheduleEvent,
  broadcastScheduleDeleted,
  broadcastNoteEvent,
  broadcastTeamEvent
} from '../services/socketService.js';

export const ScheduleController = {
  /**
   * GET /api/schedules - Listar agendas con filtros
   */
  async getAll(req, res) {
    try {
      const {
        month,
        year,
        startDate,
        endDate,
        category,
        status,
        responsible,
        search
      } = req.query;

      const schedules = await AgendaModel.findAll({
        month,
        year,
        startDate,
        endDate,
        category,
        status,
        responsible,
        search,
        id_cliente: req.user.id_cliente,
        role: req.user.rol.toLowerCase()
      });

      return sendSuccess(res, 200, 'Agendas obtenidas correctamente', schedules);
    } catch (error) {
      console.error('Error en ScheduleController.getAll:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/summary - Contadores de categorías para las 5 tarjetas
   */
  async getSummary(req, res) {
    try {
      const { month, year, startDate, endDate } = req.query;

      const counters = await AgendaModel.getSummaryCounters({
        month,
        year,
        startDate,
        endDate,
        id_cliente: req.user.id_cliente,
        role: req.user.rol.toLowerCase()
      });

      return sendSuccess(res, 200, 'Resumen de agendas obtenido', counters);
    } catch (error) {
      console.error('Error en ScheduleController.getSummary:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/week - Consultar los 7 días de una semana (Lunes a Domingo)
   */
  async getWeek(req, res) {
    try {
      const { date } = req.query;
      const refDate = date ? new Date(date) : new Date();

      if (isNaN(refDate.getTime())) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'date', reason: 'Formato de fecha inválido' });
      }

      // Calcular Lunes y Domingo de la semana
      // getDay(): 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      const dayOfWeek = refDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const startDateStr = monday.toISOString().slice(0, 19).replace('T', ' ');
      const endDateStr = sunday.toISOString().slice(0, 19).replace('T', ' ');

      const schedules = await AgendaModel.findAll({
        startDate: startDateStr,
        endDate: endDateStr,
        id_cliente: req.user.id_cliente,
        role: req.user.rol.toLowerCase()
      });

      // Estructurar los 7 días de lunes a domingo
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];
        const dayName = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i];

        const daySchedules = schedules.filter(s => {
          const sDate = s.fecha_inicio.split('T')[0] || s.fecha_inicio.split(' ')[0];
          return sDate === dateKey;
        });

        days.push({
          dayOfWeek: i + 1,
          dayName,
          date: dateKey,
          dayNumber: d.getDate(),
          monthNumber: d.getMonth() + 1,
          year: d.getFullYear(),
          schedules: daySchedules
        });
      }

      return sendSuccess(res, 200, 'Semana de lunes a domingo obtenida', {
        startDate: startDateStr.split(' ')[0],
        endDate: endDateStr.split(' ')[0],
        days
      });
    } catch (error) {
      console.error('Error en ScheduleController.getWeek:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/day - Consultar agendas de un día específico
   */
  async getDay(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();

      if (isNaN(targetDate.getTime())) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'date', reason: 'Formato de fecha inválido' });
      }

      const dateStr = targetDate.toISOString().split('T')[0];
      const startOfDay = `${dateStr} 00:00:00`;
      const endOfDay = `${dateStr} 23:59:59`;

      const schedules = await AgendaModel.findAll({
        startDate: startOfDay,
        endDate: endOfDay,
        id_cliente: req.user.id_cliente,
        role: req.user.rol.toLowerCase()
      });

      return sendSuccess(res, 200, `Agendas para la fecha ${dateStr}`, {
        date: dateStr,
        total: schedules.length,
        schedules
      });
    } catch (error) {
      console.error('Error en ScheduleController.getDay:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/categories - Catálogo de categorías
   */
  async getCategories(req, res) {
    try {
      const categories = await CategoriaAgendaModel.findAll();
      return sendSuccess(res, 200, 'Categorías de agenda obtenidas', categories);
    } catch (error) {
      console.error('Error en ScheduleController.getCategories:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/team-candidates - Candidatos autorizados para asignación (Staff)
   */
  async getStaffCandidates(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const staff = await AgendaIntegrantesModel.getStaffCandidates();
      return sendSuccess(res, 200, 'Candidatos del equipo de operaciones obtenidos', staff);
    } catch (error) {
      console.error('Error en ScheduleController.getStaffCandidates:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/:id - Consultar una agenda por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const agenda = await AgendaModel.findById(id);

      if (!agenda) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      // Restricción para clientes: solo pueden ver eventos asociados a su cuenta
      if (req.user.rol.toLowerCase() === 'cliente') {
        if (!agenda.id_cliente || Number(agenda.id_cliente) !== Number(req.user.id_cliente)) {
          return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
        }
        if (agenda.nombre_categoria !== 'Event') {
          return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
        }
      }

      return sendSuccess(res, 200, 'Agenda obtenida', agenda);
    } catch (error) {
      console.error('Error en ScheduleController.getById:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * POST /api/schedules - Crear nueva agenda
   */
  async create(req, res) {
    try {
      // Clientes no pueden crear agendas internas
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const {
        id_categoria,
        id_evento,
        id_responsable,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        imagen_portada,
        estado = 'programada',
        teamUserIds = []
      } = req.body;

      if (!id_categoria) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'id_categoria', reason: 'La categoría es obligatoria' });
      }

      if (!id_responsable) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'id_responsable', reason: 'El responsable de la agenda es obligatorio' });
      }

      if (!titulo || !titulo.trim()) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'titulo', reason: 'El título de la agenda es obligatorio' });
      }

      if (!fecha_inicio || !fecha_fin) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { reason: 'Las fechas de inicio y finalización son obligatorias' });
      }

      const startDate = new Date(fecha_inicio);
      const endDate = new Date(fecha_fin);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { reason: 'Formato de fecha inválido' });
      }

      if (endDate <= startDate) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { reason: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
      }

      if (!ubicacion || !ubicacion.trim()) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'ubicacion', reason: 'La ubicación es obligatoria' });
      }

      // Validar categoría existente
      const categoria = await CategoriaAgendaModel.findById(id_categoria);
      if (!categoria) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND', { detail: `La categoría con ID ${id_categoria} no existe` });
      }

      // Validar responsable existente
      const responsable = await UsuarioModel.findById(id_responsable);
      if (!responsable) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND', { detail: `El usuario responsable con ID ${id_responsable} no existe` });
      }

      // Validar evento si viene asignado
      if (id_evento) {
        const evento = await EventoModel.findById(id_evento);
        if (!evento) {
          return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND', { detail: `El evento comercial con ID ${id_evento} no existe` });
        }
      }

      // Comprobar detección de colisiones / conflictos de agenda
      const conflictCheck = await AgendaModel.checkConflict({
        id_responsable,
        teamUserIds,
        fecha_inicio,
        fecha_fin
      });

      if (conflictCheck.hasConflict) {
        const first = conflictCheck.conflicts[0];
        return sendError(
          res,
          409,
          'No se puede completar la operación porque existe una dependencia o conflicto.',
          'CONFLICT',
          {
            reason: `Conflicto de horario: El usuario '${first.nombre_usuario_en_conflicto}' (${first.rol_en_conflicto}) ya está asignado a la agenda '#${first.id_agenda} - ${first.titulo}' entre ${first.fecha_inicio} y ${first.fecha_fin}.`,
            conflicts: conflictCheck.conflicts
          }
        );
      }

      const nuevaAgenda = await AgendaModel.create({
        id_categoria,
        id_evento,
        id_responsable,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        imagen_portada,
        estado,
        teamUserIds
      });

      // Emitir evento por Socket.IO en tiempo real
      broadcastScheduleEvent('schedule:created', nuevaAgenda);

      return sendSuccess(res, 201, 'Agenda creada exitosamente', nuevaAgenda);
    } catch (error) {
      console.error('Error en ScheduleController.create:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * PATCH /api/schedules/:id - Actualizar datos de agenda
   */
  async update(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const agendaExistente = await AgendaModel.findById(id);

      if (!agendaExistente) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      const {
        id_categoria,
        id_evento,
        id_responsable,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        imagen_portada,
        estado,
        teamUserIds
      } = req.body;

      const finalStart = fecha_inicio || agendaExistente.fecha_inicio;
      const finalEnd = fecha_fin || agendaExistente.fecha_fin;

      if (new Date(finalEnd) <= new Date(finalStart)) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { reason: 'La fecha de finalización debe ser posterior a la fecha de inicio' });
      }

      const finalResp = id_responsable ? Number(id_responsable) : agendaExistente.id_responsable;
      const finalTeam = teamUserIds !== undefined ? teamUserIds : agendaExistente.integrantes.map(i => i.id_usuario);

      // Comprobar conflictos de horario si cambiaron fechas o integrantes
      if (fecha_inicio || fecha_fin || id_responsable || teamUserIds !== undefined) {
        const conflictCheck = await AgendaModel.checkConflict({
          id_responsable: finalResp,
          teamUserIds: finalTeam,
          fecha_inicio: finalStart,
          fecha_fin: finalEnd,
          excludeAgendaId: id
        });

        if (conflictCheck.hasConflict) {
          const first = conflictCheck.conflicts[0];
          return sendError(
            res,
            409,
            'No se puede completar la operación porque existe una dependencia o conflicto.',
            'CONFLICT',
            {
              reason: `Conflicto de horario: El usuario '${first.nombre_usuario_en_conflicto}' (${first.rol_en_conflicto}) ya está asignado a la agenda '#${first.id_agenda} - ${first.titulo}'.`,
              conflicts: conflictCheck.conflicts
            }
          );
        }
      }

      const agendaActualizada = await AgendaModel.update(id, req.body);

      // Emitir actualización en tiempo real
      broadcastScheduleEvent('schedule:updated', agendaActualizada);

      return sendSuccess(res, 200, 'Agenda actualizada correctamente', agendaActualizada);
    } catch (error) {
      console.error('Error en ScheduleController.update:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * PATCH /api/schedules/:id/reschedule - Reprogramar fechas/horas (Drag & Drop)
   */
  async reschedule(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const { fecha_inicio, fecha_fin } = req.body;

      if (!fecha_inicio || !fecha_fin) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { reason: 'Se requieren fecha_inicio y fecha_fin' });
      }

      const agendaExistente = await AgendaModel.findById(id);
      if (!agendaExistente) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { reason: 'La fecha de finalización debe ser posterior al inicio' });
      }

      // Validar colisiones
      const teamUserIds = agendaExistente.integrantes.map(i => i.id_usuario);
      const conflictCheck = await AgendaModel.checkConflict({
        id_responsable: agendaExistente.id_responsable,
        teamUserIds,
        fecha_inicio,
        fecha_fin,
        excludeAgendaId: id
      });

      if (conflictCheck.hasConflict) {
        const first = conflictCheck.conflicts[0];
        return sendError(
          res,
          409,
          'No se puede completar la operación porque existe una dependencia o conflicto.',
          'CONFLICT',
          {
            reason: `Conflicto de reprogramación: '${first.nombre_usuario_en_conflicto}' ya tiene la agenda '#${first.id_agenda} - ${first.titulo}' en ese período.`,
            conflicts: conflictCheck.conflicts
          }
        );
      }

      const reprogramada = await AgendaModel.reschedule(id, fecha_inicio, fecha_fin);

      // Emitir en tiempo real
      broadcastScheduleEvent('schedule:rescheduled', reprogramada);

      return sendSuccess(res, 200, 'Agenda reprogramada correctamente', reprogramada);
    } catch (error) {
      console.error('Error en ScheduleController.reschedule:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * DELETE /api/schedules/:id - Eliminar agenda
   */
  async delete(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const agenda = await AgendaModel.findById(id);

      if (!agenda) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      await AgendaModel.delete(id);

      // Emitir eliminación en tiempo real
      broadcastScheduleDeleted(id, agenda.id_cliente);

      return sendSuccess(res, 200, `Agenda #${id} eliminada correctamente`);
    } catch (error) {
      console.error('Error en ScheduleController.delete:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/:id/notes - Consultar notas de agenda
   */
  async getNotes(req, res) {
    try {
      const { id } = req.params;
      const agenda = await AgendaModel.findById(id);

      if (!agenda) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      // Clientes no tienen acceso a notas operativas internas
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const notas = await AgendaNotasModel.findByAgenda(id);
      return sendSuccess(res, 200, 'Notas obtenidas', notas);
    } catch (error) {
      console.error('Error en ScheduleController.getNotes:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * POST /api/schedules/:id/notes - Crear nota operativa
   */
  async createNote(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const { descripcion, fecha_limite } = req.body;

      if (!descripcion || !descripcion.trim()) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'descripcion', reason: 'La descripción de la nota es requerida' });
      }

      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      const nota = await AgendaNotasModel.create({
        id_agenda: id,
        id_usuario: req.user.id_usuario,
        descripcion,
        fecha_limite
      });

      broadcastNoteEvent('schedule:note-created', nota, agenda);

      return sendSuccess(res, 201, 'Nota operativa registrada', nota);
    } catch (error) {
      console.error('Error en ScheduleController.createNote:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * PATCH /api/schedules/notes/:id - Modificar o completar nota
   */
  async updateNote(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const nota = await AgendaNotasModel.findById(id);

      if (!nota) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      const notaActualizada = await AgendaNotasModel.update(id, req.body);
      const agenda = await AgendaModel.findById(nota.id_agenda);

      broadcastNoteEvent('schedule:note-updated', notaActualizada, agenda);

      return sendSuccess(res, 200, 'Nota actualizada correctamente', notaActualizada);
    } catch (error) {
      console.error('Error en ScheduleController.updateNote:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * DELETE /api/schedules/notes/:id - Eliminar nota
   */
  async deleteNote(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const nota = await AgendaNotasModel.findById(id);

      if (!nota) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      await AgendaNotasModel.delete(id);
      const agenda = await AgendaModel.findById(nota.id_agenda);

      broadcastNoteEvent('schedule:note-deleted', { id_nota: id }, agenda);

      return sendSuccess(res, 200, 'Nota eliminada correctamente');
    } catch (error) {
      console.error('Error en ScheduleController.deleteNote:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * POST /api/schedules/:id/team - Asignar integrante al equipo
   */
  async addTeamMember(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id } = req.params;
      const { id_usuario } = req.body;

      if (!id_usuario) {
        return sendError(res, 400, 'Los datos enviados no son válidos.', 'BAD_REQUEST', { field: 'id_usuario', reason: 'El ID de usuario es obligatorio' });
      }

      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      const usuario = await UsuarioModel.findById(id_usuario);
      if (!usuario) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND', { detail: 'Usuario no encontrado' });
      }

      // Comprobar conflicto para el nuevo integrante
      const conflictCheck = await AgendaModel.checkConflict({
        id_responsable: id_usuario,
        teamUserIds: [],
        fecha_inicio: agenda.fecha_inicio,
        fecha_fin: agenda.fecha_fin,
        excludeAgendaId: id
      });

      if (conflictCheck.hasConflict) {
        const first = conflictCheck.conflicts[0];
        return sendError(
          res,
          409,
          'No se puede completar la operación porque existe una dependencia o conflicto.',
          'CONFLICT',
          {
            reason: `Conflicto: El usuario '${usuario.nombre}' ya tiene programada la agenda '#${first.id_agenda} - ${first.titulo}'.`,
            conflicts: conflictCheck.conflicts
          }
        );
      }

      await AgendaIntegrantesModel.addMember(id, id_usuario);
      const updatedTeam = await AgendaIntegrantesModel.findByAgenda(id);

      broadcastTeamEvent('schedule:team-updated', updatedTeam, agenda);

      return sendSuccess(res, 201, 'Integrante asignado al equipo', updatedTeam);
    } catch (error) {
      console.error('Error en ScheduleController.addTeamMember:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * DELETE /api/schedules/:id/team/:userId - Remover integrante del equipo
   */
  async removeTeamMember(req, res) {
    try {
      if (req.user.rol.toLowerCase() === 'cliente') {
        return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
      }

      const { id, userId } = req.params;
      const agenda = await AgendaModel.findById(id);

      if (!agenda) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      await AgendaIntegrantesModel.removeMember(id, userId);
      const updatedTeam = await AgendaIntegrantesModel.findByAgenda(id);

      broadcastTeamEvent('schedule:team-updated', updatedTeam, agenda);

      return sendSuccess(res, 200, 'Integrante retirado del equipo', updatedTeam);
    } catch (error) {
      console.error('Error en ScheduleController.removeTeamMember:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/export/ics - Exportar agendas a formato iCalendar (.ics)
   */
  async exportICS(req, res) {
    try {
      const { month, year, startDate, endDate, category } = req.query;

      const schedules = await AgendaModel.findAll({
        month,
        year,
        startDate,
        endDate,
        category,
        id_cliente: req.user.id_cliente,
        role: req.user.rol.toLowerCase()
      });

      const icsData = generateICS(schedules);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="nexoeventos-agenda.ics"');
      return res.send(icsData);
    } catch (error) {
      console.error('Error en ScheduleController.exportICS:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  },

  /**
   * GET /api/schedules/:id/export/ics - Exportar una agenda individual a .ics
   */
  async exportSingleICS(req, res) {
    try {
      const { id } = req.params;
      const agenda = await AgendaModel.findById(id);

      if (!agenda) {
        return sendError(res, 404, 'No se encontró el recurso solicitado.', 'NOT_FOUND');
      }

      // Restricción clientes
      if (req.user.rol.toLowerCase() === 'cliente') {
        if (!agenda.id_cliente || Number(agenda.id_cliente) !== Number(req.user.id_cliente) || agenda.nombre_categoria !== 'Event') {
          return sendError(res, 403, 'No tienes permisos para realizar esta operación.', 'FORBIDDEN');
        }
      }

      const icsData = generateICS([agenda]);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="agenda-${id}.ics"`);
      return res.send(icsData);
    } catch (error) {
      console.error('Error en ScheduleController.exportSingleICS:', error);
      return sendError(res, 500, 'Ocurrió un error interno. Inténtalo nuevamente.', 'INTERNAL_ERROR');
    }
  }
};

