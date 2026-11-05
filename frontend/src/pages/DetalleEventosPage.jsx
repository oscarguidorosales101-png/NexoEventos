import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { detalleEventoService } from '../services/detalleEventoService.js';
import { eventoService } from '../services/eventoService.js';
import { servicioService } from '../services/servicioService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Briefcase,
  DollarSign,
  ArrowLeft
} from 'lucide-react';

export const DetalleEventosPage = () => {
  const { isAdmin, isSupervisor, isClient } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const idEventoParam = searchParams.get('id_evento');

  const [detalles, setDetalles] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventoId, setSelectedEventoId] = useState(idEventoParam || '');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [formData, setFormData] = useState({
    id_evento: '',
    id_servicio: '',
    cantidad: 1,
    precio_unitario: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [detalleToDelete, setDetalleToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [detallesData, eventosData, serviciosData] = await Promise.all([
        detalleEventoService.getAll(selectedEventoId || null),
        eventoService.getAll(),
        servicioService.getAll()
      ]);
      setDetalles(detallesData);
      setEventos(eventosData);
      // Para clientes solo servicios activos
      setServicios(isClient ? serviciosData.filter(s => s.estado === 'activo') : serviciosData);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al cargar detalles de eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEventoId, isClient]);

  const handleEventoFilterChange = (e) => {
    const val = e.target.value;
    setSelectedEventoId(val);
    if (val) {
      setSearchParams({ id_evento: val });
    } else {
      setSearchParams({});
    }
  };

  const handleOpenCreate = () => {
    setEditingDetalle(null);
    const initialEventoId = selectedEventoId || (eventos[0]?.id_evento ? String(eventos[0].id_evento) : '');
    const firstServicio = servicios[0];

    setFormData({
      id_evento: initialEventoId,
      id_servicio: firstServicio ? String(firstServicio.id_servicio) : '',
      cantidad: 1,
      precio_unitario: firstServicio ? String(firstServicio.precio) : ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (detalle) => {
    setEditingDetalle(detalle);
    setFormData({
      id_evento: String(detalle.id_evento),
      id_servicio: String(detalle.id_servicio),
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleServicioChange = (e) => {
    const sId = e.target.value;
    const found = servicios.find(s => String(s.id_servicio) === String(sId));
    setFormData(prev => ({
      ...prev,
      id_servicio: sId,
      precio_unitario: found ? String(found.precio) : prev.precio_unitario
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    try {
      if (editingDetalle) {
        await detalleEventoService.update(editingDetalle.id_detalle, formData);
        setSuccess('Servicio de evento actualizado correctamente');
      } else {
        await detalleEventoService.create(formData);
        setSuccess('Servicio agregado al evento exitosamente');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al guardar el servicio en el evento');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDelete = (detalle) => {
    setDetalleToDelete(detalle);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!detalleToDelete) return;
    try {
      setError(null);
      await detalleEventoService.delete(detalleToDelete.id_detalle);
      setSuccess('Servicio removido del evento exitosamente');
      fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al eliminar detalle');
    } finally {
      setDetalleToDelete(null);
    }
  };

  // Calcular total acumulado de los detalles mostrados
  const totalPresupuestoDesglosado = detalles.reduce((acc, d) => acc + Number(d.subtotal || (d.cantidad * d.precio_unitario)), 0);

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            {selectedEventoId && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => { setSelectedEventoId(''); setSearchParams({}); }}
              >
                <ArrowLeft size={14} />
                <span>Ver Todos</span>
              </button>
            )}
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={24} style={{ color: 'var(--gold-primary)' }} />
              <span>Detalle de Servicios por Evento</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Desglose de servicios contratados, cantidades y precios unitarios pactados
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} disabled={eventos.length === 0 || servicios.length === 0}>
          <Plus size={18} />
          <span>Agregar Servicio al Evento</span>
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

      {/* Selector de Evento */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <label htmlFor="filter_by_evento" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Filtrar por Evento:
          </label>
          <select
            id="filter_by_evento"
            className="form-select"
            value={selectedEventoId}
            onChange={handleEventoFilterChange}
          >
            <option value="">-- Todos los eventos registrados --</option>
            {eventos.map(e => (
              <option key={e.id_evento} value={e.id_evento}>
                #{e.id_evento} - {e.nombre} ({e.fecha_evento}) - {e.nombre_cliente}
              </option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Subtotal Seleccionado
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
            ${totalPresupuestoDesglosado.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tabla de Detalles */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Cargando desglose de servicios...</p>
          </div>
        ) : detalles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Layers size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
            <p style={{ fontSize: '1rem' }}>No se han agregado servicios a este evento todavía.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Utilice el botón superior para agregar el primer servicio con su precio pactado.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Evento Asociado</th>
                  <th>Servicio Contratado</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Precio Unitario Pactado</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d) => (
                  <tr key={d.id_detalle}>
                    <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{d.id_detalle}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.nombre_evento}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID Evento: #{d.id_evento} · {d.fecha_evento}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.nombre_servicio}</div>
                      {d.precio_catalogo_actual && Number(d.precio_catalogo_actual) !== Number(d.precio_unitario) && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--gold-light)' }}>
                          Precio catálogo hoy: ${Number(d.precio_catalogo_actual).toFixed(2)} (Pactado previamente)
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-hover)', color: '#FFFFFF', fontSize: '0.85rem' }}>
                        {d.cantidad}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${Number(d.precio_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold-primary)' }}>
                      ${Number(d.subtotal || (d.cantidad * d.precio_unitario)).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(d)}
                          title="Editar cantidad o precio"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenDelete(d)}
                          title="Remover servicio del evento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Detalle */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDetalle ? `Editar Detalle de Servicio #${editingDetalle.id_detalle}` : 'Agregar Servicio al Evento'}
      >
        <form onSubmit={handleFormSubmit}>
          {/* Selector de Evento */}
          <div className="form-group">
            <label className="form-label" htmlFor="modal_det_evento">Evento Destino *</label>
            <select
              id="modal_det_evento"
              className="form-select"
              value={formData.id_evento}
              onChange={(e) => setFormData({ ...formData, id_evento: e.target.value })}
              required
              disabled={!!editingDetalle}
            >
              <option value="">-- Seleccione el evento --</option>
              {eventos.map(e => (
                <option key={e.id_evento} value={e.id_evento}>
                  #{e.id_evento} - {e.nombre} ({e.fecha_evento})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Servicio */}
          <div className="form-group">
            <label className="form-label" htmlFor="modal_det_servicio">Servicio a Contratar *</label>
            <select
              id="modal_det_servicio"
              className="form-select"
              value={formData.id_servicio}
              onChange={handleServicioChange}
              required
            >
              <option value="">-- Seleccione un servicio del catálogo --</option>
              {servicios.map(s => (
                <option key={s.id_servicio} value={s.id_servicio}>
                  {s.nombre} — ${Number(s.precio).toFixed(2)} ({s.estado})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="modal_det_cantidad">Cantidad *</label>
              <input
                id="modal_det_cantidad"
                type="number"
                min="1"
                step="1"
                className="form-control"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal_det_precio">Precio Unitario Pactado *</label>
              <input
                id="modal_det_precio"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={formData.precio_unitario}
                onChange={(e) => setFormData({ ...formData, precio_unitario: e.target.value })}
                required
                disabled={isClient}
              />
              {isClient && (
                <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                  El precio está regulado por la tarifa oficial del catálogo
                </small>
              )}
            </div>
          </div>

          {/* Cálculo previo */}
          <div style={{
            padding: '0.875rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subtotal Estimado:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
              ${(Number(formData.cantidad || 0) * Number(formData.precio_unitario || 0)).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </span>
          </div>

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
              {formSubmitting ? 'Guardando...' : editingDetalle ? 'Actualizar Detalle' : 'Agregar al Evento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remover Servicio del Evento"
        message={`¿Confirma la eliminación del servicio "${detalleToDelete?.nombre_servicio}" de este evento?`}
        confirmText="Remover Servicio"
      />
    </div>
  );
};

