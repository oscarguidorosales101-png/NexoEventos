import React, { useState, useEffect } from 'react';
import { rolService } from '../services/rolService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { Shield, Edit2, AlertCircle, CheckCircle, Info, Lock } from 'lucide-react';

export const RolesPage = () => {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rolService.getAll();
      setRoles(data);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenEdit = (rol) => {
    setEditingRol(rol);
    setDescripcion(rol.descripcion || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    try {
      await rolService.update(editingRol.id_rol, {
        nombre: editingRol.nombre,
        descripcion
      });
      setSuccess(`Descripción del rol "${editingRol.nombre}" actualizada`);
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al actualizar el rol');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={24} style={{ color: 'var(--gold-primary)' }} />
          <span>Catálogo de Roles del Sistema</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Estructura de perfiles de autorización y permisos basados en roles (RBAC)
        </p>
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

      {/* Nota de Política de Catálogo Fijo */}
      <div className="card" style={{
        borderColor: 'var(--border-gold)',
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <div style={{ color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
          <Info size={22} />
        </div>
        <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--gold-primary)' }}>Política de Catálogo Estructural Fijo:</strong>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            NexoEventos implementa una matriz fija de tres roles funcionales: <strong>administrador</strong>, <strong>supervisor</strong> y <strong>cliente</strong>.
            Por directriz arquitectónica de seguridad e integridad referencial, estos tres roles son permanentes y protegidos contra eliminación o alteración de identificadores. Puede editar sus descripciones operativas.
          </p>
        </div>
      </div>

      {/* Tabla de Roles */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Consultando catálogo...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Rol</th>
                  <th>Descripción Funcional</th>
                  <th>Nivel de Privilegios</th>
                  <th>Estado del Catálogo</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id_rol}>
                    <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{r.id_rol}</td>
                    <td style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                      <span className={`badge badge-rol-${r.nombre.toLowerCase()}`}>
                        <Shield size={12} />
                        {r.nombre}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-main)', maxWidth: '400px' }}>
                      {r.descripcion || '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {r.id_rol === 1 && 'Control Total (CRUD, Usuarios, Roles, Sistema)'}
                      {r.id_rol === 2 && 'Gestión Operativa (Clientes, Eventos, Servicios)'}
                      {r.id_rol === 3 && 'Acceso Limitado (Eventos y perfil propios)'}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <Lock size={10} />
                        Protegido / Fijo
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(r)}
                        title="Editar descripción del rol"
                      >
                        <Edit2 size={14} />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Editar Rol */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Editar Rol: ${editingRol?.nombre}`}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="modal_rol_nombre">Nombre del Rol (Protegido)</label>
            <input
              id="modal_rol_nombre"
              type="text"
              className="form-control"
              value={editingRol?.nombre || ''}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="modal_rol_desc">Descripción Operativa *</label>
            <textarea
              id="modal_rol_desc"
              className="form-control"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
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
              {formSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

