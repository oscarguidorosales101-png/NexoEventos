import React, { useState, useEffect } from 'react';
import { servicioService } from '../services/servicioService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Briefcase, Search, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

export const ServiciosPage = () => {
  const { isAdmin, isSupervisor, isClient } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    estado: 'activo'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal de Confirmación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [servicioToDelete, setServicioToDelete] = useState(null);

  const fetchServicios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicioService.getAll();
      setServicios(data);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al cargar el catálogo de servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const handleOpenCreate = () => {
    setEditingServicio(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      estado: 'activo'
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (servicio) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      precio: servicio.precio,
      estado: servicio.estado
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    try {
      if (editingServicio) {
        await servicioService.update(editingServicio.id_servicio, formData);
        setSuccess(`Servicio "${formData.nombre}" actualizado correctamente`);
      } else {
        await servicioService.create(formData);
        setSuccess(`Servicio "${formData.nombre}" agregado al catálogo`);
      }
      setIsModalOpen(false);
      fetchServicios();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al guardar el servicio');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDelete = (servicio) => {
    setServicioToDelete(servicio);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!servicioToDelete) return;
    try {
      setError(null);
      await servicioService.delete(servicioToDelete.id_servicio);
      setSuccess(`Servicio "${servicioToDelete.nombre}" eliminado exitosamente`);
      fetchServicios();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al eliminar servicio');
    } finally {
      setServicioToDelete(null);
    }
  };

  const filteredServicios = servicios.filter(s =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.descripcion && s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} style={{ color: 'var(--gold-primary)' }} />
            <span>Catálogo de Servicios de NexoEventos</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isClient
              ? 'Consulte los servicios exclusivos de alta gama disponibles para contratación en sus eventos'
              : 'Gestión de servicios de planificación, logística, gastronomía y producción audiovisual'}
          </p>
        </div>

        {(isAdmin || isSupervisor) && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nuevo Servicio</span>
          </button>
        )}
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

      {/* Buscador */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar por nombre o descripción de servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {/* Listado / Tabla de Servicios */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Cargando catálogo...</p>
          </div>
        ) : filteredServicios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Briefcase size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
            <p>No se encontraron servicios en el catálogo.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Servicio</th>
                  <th>Descripción</th>
                  <th>Precio Referencial</th>
                  <th>Estado</th>
                  {(isAdmin || isSupervisor) && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredServicios.map((s) => (
                  <tr key={s.id_servicio}>
                    <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{s.id_servicio}</td>
                    <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: '350px' }}>{s.descripcion || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>
                      ${Number(s.precio).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge badge-${s.estado}`}>
                        {s.estado}
                      </span>
                    </td>
                    {(isAdmin || isSupervisor) && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(s)}
                            title="Editar servicio"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleOpenDelete(s)}
                            title="Eliminar servicio"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Servicio */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingServicio ? `Editar Servicio #${editingServicio.id_servicio}` : 'Agregar Servicio al Catálogo'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="modal_serv_nombre">Nombre del Servicio *</label>
            <input
              id="modal_serv_nombre"
              type="text"
              className="form-control"
              placeholder="Ej. Catering Gourmet de 4 Tiempos"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_serv_desc">Descripción Detallada</label>
            <textarea
              id="modal_serv_desc"
              className="form-control"
              rows={3}
              placeholder="Describa el alcance, personal incluido y elementos de entrega..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_serv_precio">Precio Base *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="modal_serv_precio"
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="0.00"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                required
              />
              <DollarSign size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_serv_estado">Estado de Disponibilidad *</label>
            <select
              id="modal_serv_estado"
              className="form-select"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              required
            >
              <option value="activo">Activo (Disponible para contratación)</option>
              <option value="inactivo">Inactivo (Temporalmente suspendido)</option>
            </select>
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
              {formSubmitting ? 'Guardando...' : editingServicio ? 'Actualizar Servicio' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Servicio del Catálogo"
        message={`¿Confirma la eliminación del servicio "${servicioToDelete?.nombre}"? Solo podrá eliminarse si no forma parte del detalle de algún evento registrado.`}
        confirmText="Eliminar Servicio"
      />
    </div>
  );
};

