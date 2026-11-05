import React, { useState, useEffect } from 'react';
import { clienteService } from '../services/clienteService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Users, Search, AlertCircle, CheckCircle, Building, User } from 'lucide-react';

export const ClientesPage = () => {
  const { isAdmin, isSupervisor } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados del modal de formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    tipo_cliente: 'persona',
    nombre: '',
    correo: '',
    telefono: '',
    direccion: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Estados del modal de confirmación de eliminación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      tipo_cliente: 'persona',
      nombre: '',
      correo: '',
      telefono: '',
      direccion: ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cliente) => {
    setEditingClient(cliente);
    setFormData({
      tipo_cliente: cliente.tipo_cliente,
      nombre: cliente.nombre,
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    try {
      if (editingClient) {
        await clienteService.update(editingClient.id_cliente, formData);
        setSuccess(`Cliente "${formData.nombre}" actualizado correctamente`);
      } else {
        await clienteService.create(formData);
        setSuccess(`Cliente "${formData.nombre}" creado exitosamente`);
      }
      setIsModalOpen(false);
      fetchClientes();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al guardar cliente');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDelete = (cliente) => {
    setClientToDelete(cliente);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      setError(null);
      await clienteService.delete(clientToDelete.id_cliente);
      setSuccess(`Cliente "${clientToDelete.nombre}" eliminado del sistema`);
      fetchClientes();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al eliminar cliente');
    } finally {
      setClientToDelete(null);
    }
  };

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.correo && c.correo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.telefono && c.telefono.includes(searchTerm))
  );

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} style={{ color: 'var(--gold-primary)' }} />
            <span>Gestión de Clientes</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Registro y administración de personas y empresas contratantes
          </p>
        </div>

        {(isAdmin || isSupervisor) && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nuevo Cliente</span>
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

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar por nombre, correo o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Cargando registros de clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
            <p style={{ fontSize: '1rem' }}>No se encontraron clientes registrados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Nombre / Razón Social</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Eventos</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((c) => (
                  <tr key={c.id_cliente}>
                    <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{c.id_cliente}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: c.tipo_cliente === 'empresa' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                        color: c.tipo_cliente === 'empresa' ? 'var(--accent-info)' : 'var(--gold-primary)',
                        border: '1px solid currentColor'
                      }}>
                        {c.tipo_cliente === 'empresa' ? <Building size={12} /> : <User size={12} />}
                        {c.tipo_cliente}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.correo || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.telefono || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.direccion || '—'}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)' }}>
                        {c.total_eventos || 0} evento(s)
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(c)}
                          title="Editar cliente"
                        >
                          <Edit2 size={14} />
                        </button>
                        {(isAdmin || isSupervisor) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleOpenDelete(c)}
                            title="Eliminar cliente"
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

      {/* Modal Formulario Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? `Editar Cliente #${editingClient.id_cliente}` : 'Registrar Nuevo Cliente'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="modal_tipo_cliente">Tipo de Cliente *</label>
            <select
              id="modal_tipo_cliente"
              className="form-select"
              value={formData.tipo_cliente}
              onChange={(e) => setFormData({ ...formData, tipo_cliente: e.target.value })}
              required
            >
              <option value="persona">Persona Natural</option>
              <option value="empresa">Empresa / Corporativo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_nombre">Nombre o Razón Social *</label>
            <input
              id="modal_nombre"
              type="text"
              className="form-control"
              placeholder="Ej. Corporación Horizonte S.A.S."
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_correo">Correo Electrónico</label>
            <input
              id="modal_correo"
              type="email"
              className="form-control"
              placeholder="cliente@dominio.com"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_telefono">Teléfono</label>
            <input
              id="modal_telefono"
              type="text"
              className="form-control"
              placeholder="+57 310 000 0000"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_direccion">Dirección</label>
            <input
              id="modal_direccion"
              type="text"
              className="form-control"
              placeholder="Calle 123 # 45-67"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            />
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
              {formSubmitting ? 'Guardando...' : editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Registro de Cliente"
        message={`¿Desea eliminar permanentemente al cliente "${clientToDelete?.nombre}"? Esta operación solo procederá si no tiene eventos vinculados.`}
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};

