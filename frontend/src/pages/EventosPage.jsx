import React, { useState, useEffect } from 'react';
import { eventoService } from '../services/eventoService.js';
import { clienteService } from '../services/clienteService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Layers,
  MapPin,
  Clock
} from 'lucide-react';

export const EventosPage = () => {
  const { user, isAdmin, isSupervisor, isClient } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [formData, setFormData] = useState({
    id_cliente: '',
    nombre: '',
    tipo_evento: '',
    fecha_evento: '',
    ubicacion: '',
    estado: 'pendiente'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Confirmación de Eliminación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventosData, clientesData] = await Promise.all([
        eventoService.getAll(),
        (isAdmin || isSupervisor) ? clienteService.getAll() : Promise.resolve([])
      ]);
      setEventos(eventosData);
      setClientes(clientesData);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingEvento(null);
    setFormData({
      id_cliente: isClient ? (user?.id_cliente || '') : (clientes[0]?.id_cliente || ''),
      nombre: '',
      tipo_evento: 'Boda',
      fecha_evento: new Date().toISOString().split('T')[0],
      ubicacion: '',
      estado: 'pendiente'
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evento) => {
    setEditingEvento(evento);
    setFormData({
      id_cliente: evento.id_cliente,
      nombre: evento.nombre,
      tipo_evento: evento.tipo_evento,
      fecha_evento: evento.fecha_evento,
      ubicacion: evento.ubicacion,
      estado: evento.estado
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    try {
      if (editingEvento) {
        await eventoService.update(editingEvento.id_evento, formData);
        setSuccess(`Evento "${formData.nombre}" actualizado correctamente`);
      } else {
        await eventoService.create(formData);
        setSuccess(`Evento "${formData.nombre}" registrado exitosamente`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al guardar el evento');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDelete = (evento) => {
    setEventoToDelete(evento);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventoToDelete) return;
    try {
      setError(null);
      await eventoService.delete(eventoToDelete.id_evento);
      setSuccess(`Evento "${eventoToDelete.nombre}" eliminado correctamente`);
      fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al eliminar el evento');
    } finally {
      setEventoToDelete(null);
    }
  };

  const filteredEventos = eventos.filter(e => {
    const matchesSearch =
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.nombre_cliente && e.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.tipo_evento.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || e.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={24} style={{ color: 'var(--gold-primary)' }} />
            <span>{isClient ? 'Mis Eventos Contratados' : 'Planificación y Gestión de Eventos'}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isClient
              ? 'Consulte el estado, detalles y servicios asociados a sus solicitudes'
              : 'Gestión integral de fechas, locaciones, presupuestos y desgloses de servicios'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          <span>{isClient ? 'Solicitar Evento' : 'Nuevo Evento'}</span>
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar por nombre, cliente, tipo o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label htmlFor="filter_status" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Estado:
          </label>
          <select
            id="filter_status"
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Eventos */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Cargando eventos...</p>
          </div>
        ) : filteredEventos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
            <p>No se encontraron eventos con los criterios seleccionados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Evento</th>
                  {!isClient && <th>Cliente Titular</th>}
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Ubicación</th>
                  <th>Presupuesto Total</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEventos.map((e) => (
                  <tr key={e.id_evento}>
                    <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{e.id_evento}</td>
                    <td style={{ fontWeight: 600 }}>{e.nombre}</td>
                    {!isClient && (
                      <td>
                        <span style={{ display: 'block', fontWeight: 500 }}>{e.nombre_cliente}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{e.tipo_cliente}</span>
                      </td>
                    )}
                    <td>{e.tipo_evento}</td>
                    <td>{e.fecha_evento}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                        <span>{e.ubicacion}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--gold-primary)' }}>
                      ${Number(e.total_presupuesto || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                        {e.total_servicios || 0} servicio(s)
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${e.estado}`}>
                        {e.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/detalle-eventos?id_evento=${e.id_evento}`}
                          className="btn btn-outline-gold btn-sm"
                          title="Gestionar servicios contratados para este evento"
                        >
                          <Layers size={14} />
                          <span>Servicios ({e.total_servicios || 0})</span>
                        </Link>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(e)}
                          title="Editar evento"
                        >
                          <Edit2 size={14} />
                        </button>
                        {(isAdmin || isSupervisor) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleOpenDelete(e)}
                            title="Eliminar evento"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Evento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvento ? `Editar Evento #${editingEvento.id_evento}` : isClient ? 'Solicitar Nuevo Evento' : 'Registrar Nuevo Evento'}
      >
        <form onSubmit={handleFormSubmit}>
          {/* Selector Relacional de Clientes para Admin/Supervisor */}
          {(isAdmin || isSupervisor) && (
            <div className="form-group">
              <label className="form-label" htmlFor="modal_evt_cliente">Cliente Titular *</label>
              <select
                id="modal_evt_cliente"
                className="form-select"
                value={formData.id_cliente}
                onChange={(e) => setFormData({ ...formData, id_cliente: e.target.value })}
                required
              >
                <option value="">-- Seleccione un cliente registrado --</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    #{c.id_cliente} - {c.nombre} ({c.tipo_cliente})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="modal_evt_nombre">Nombre del Evento *</label>
            <input
              id="modal_evt_nombre"
              type="text"
              className="form-control"
              placeholder="Ej. Gala Anual de Reconocimiento 2026"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="modal_evt_tipo">Tipo de Evento *</label>
              <input
                id="modal_evt_tipo"
                type="text"
                className="form-control"
                placeholder="Boda, Corporativo, Aniversario..."
                value={formData.tipo_evento}
                onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal_evt_fecha">Fecha Programada *</label>
              <input
                id="modal_evt_fecha"
                type="date"
                className="form-control"
                value={formData.fecha_evento}
                onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_evt_ubicacion">Ubicación / Salón / Hacienda *</label>
            <input
              id="modal_evt_ubicacion"
              type="text"
              className="form-control"
              placeholder="Ej. Salón Cristal - Hotel Grand Palace"
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              required
            />
          </div>

          {/* Estado del Evento */}
          {(isAdmin || isSupervisor) ? (
            <div className="form-group">
              <label className="form-label" htmlFor="modal_evt_estado">Estado Administrativo *</label>
              <select
                id="modal_evt_estado"
                className="form-select"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                required
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          ) : (
            editingEvento && (
              <div className="form-group">
                <label className="form-label" htmlFor="modal_evt_estado_cliente">Estado de la Solicitud</label>
                <select
                  id="modal_evt_estado_cliente"
                  className="form-select"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  <option value={editingEvento.estado}>{editingEvento.estado} (Actual)</option>
                  <option value="cancelado">Cancelar mi solicitud</option>
                </select>
              </div>
            )
          )}

          <div className="modal-footer" style={{ borderTop: 'none', padding: '1rem 0 0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Guardando...' : editingEvento ? 'Actualizar Evento' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Registro de Evento"
        message={`¿Confirma la eliminación del evento "${eventoToDelete?.nombre}"? Esta acción solo se ejecutará si el evento no tiene servicios agregados en su detalle.`}
        confirmText="Eliminar Evento"
      />
    </div>
  );
};

