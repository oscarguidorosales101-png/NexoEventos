import React, { useState, useEffect } from 'react';
import { usuarioService } from '../services/usuarioService.js';
import { rolService } from '../services/rolService.js';
import { clienteService } from '../services/clienteService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Shield,
  Lock,
  Mail,
  User,
  Building
} from 'lucide-react';

export const UsuariosPage = () => {
  const { user, isAdmin, isSupervisor } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    id_rol: '2',
    id_cliente: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usuariosData, rolesData, clientesData] = await Promise.all([
        usuarioService.getAll(),
        isAdmin ? rolService.getAll().catch(() => []) : Promise.resolve([]),
        clienteService.getAll().catch(() => [])
      ]);
      setUsuarios(usuariosData);
      setRoles(rolesData);
      setClientes(clientesData);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleOpenCreate = () => {
    setEditingUsuario(null);
    setFormData({
      nombre: '',
      correo: '',
      password: '',
      id_rol: '2', // Por defecto supervisor
      id_cliente: ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUsuario(u);
    setFormData({
      nombre: u.nombre,
      correo: u.correo,
      password: '', // En blanco si no se desea modificar
      id_rol: String(u.id_rol),
      id_cliente: u.id_cliente ? String(u.id_cliente) : ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    // Validación de contraseña
    if (!editingUsuario && (!formData.password || formData.password.length < 8)) {
      setError('La contraseña debe tener mínimo 8 caracteres para nuevos usuarios');
      setFormSubmitting(false);
      return;
    }

    if (editingUsuario && formData.password && formData.password.length < 8) {
      setError('La nueva contraseña debe tener mínimo 8 caracteres');
      setFormSubmitting(false);
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre,
        correo: formData.correo,
        id_rol: Number(formData.id_rol),
        id_cliente: Number(formData.id_rol) === 3 ? (formData.id_cliente ? Number(formData.id_cliente) : null) : null
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUsuario) {
        await usuarioService.update(editingUsuario.id_usuario, payload);
        setSuccess(`Usuario "${formData.nombre}" actualizado correctamente`);
      } else {
        await usuarioService.create(payload);
        setSuccess(`Usuario "${formData.nombre}" registrado exitosamente`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al guardar usuario');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDelete = (u) => {
    setUsuarioToDelete(u);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return;
    try {
      setError(null);
      await usuarioService.delete(usuarioToDelete.id_usuario);
      setSuccess(`Usuario "${usuarioToDelete.nombre}" eliminado correctamente`);
      fetchData();
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al eliminar usuario');
    } finally {
      setUsuarioToDelete(null);
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.rol && u.rol.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={24} style={{ color: 'var(--gold-primary)' }} />
            <span>Gestión de Cuentas y Accesos</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isAdmin
              ? 'Administración centralizada de usuarios, asignación de roles y vinculación con perfiles de clientes'
              : 'Supervisión y consulta del personal y clientes registrados en el sistema (Modo solo lectura)'}
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nuevo Usuario</span>
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
            placeholder="Buscar usuario por nombre, correo o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Cargando directorio de usuarios...</p>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <UserCheck size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
            <p>No se encontraron usuarios registrados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                  <th>Cliente Vinculado</th>
                  <th>Fecha Creación</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((u) => (
                  <tr key={u.id_usuario}>
                    <td style={{ fontWeight: 600, color: 'var(--gold-primary)' }}>#{u.id_usuario}</td>
                    <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.correo}</td>
                    <td>
                      <span className={`badge badge-rol-${u.rol?.toLowerCase()}`}>
                        <Shield size={12} />
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      {u.id_cliente ? (
                        <span style={{ color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                          #{u.id_cliente} - {u.nombre_cliente}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                          Personal Administrativo
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {u.fecha_creacion ? u.fecha_creacion.split('T')[0] : '—'}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(u)}
                            title="Editar usuario"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleOpenDelete(u)}
                            title="Eliminar usuario"
                            disabled={Number(u.id_usuario) === Number(user?.id_usuario)}
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

      {/* Modal Crear/Editar Usuario */}
      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUsuario ? `Editar Usuario #${editingUsuario.id_usuario}` : 'Crear Cuenta de Usuario'}
        >
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="modal_usr_nombre">Nombre Completo *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="modal_usr_nombre"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Ej. Roberto Gómez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal_usr_correo">Correo Electrónico *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="modal_usr_correo"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="usuario@nexoeventos.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal_usr_pass">
                {editingUsuario ? 'Nueva Contraseña (Dejar en blanco para conservar la actual)' : 'Contraseña *'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="modal_usr_pass"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUsuario}
                  minLength={8}
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal_usr_rol">Rol en el Sistema *</label>
              <select
                id="modal_usr_rol"
                className="form-select"
                value={formData.id_rol}
                onChange={(e) => setFormData({ ...formData, id_rol: e.target.value })}
                required
              >
                <option value="1">Administrador (Acceso total)</option>
                <option value="2">Supervisor (Operaciones y gestión)</option>
                <option value="3">Cliente (Acceso restringido a sus eventos)</option>
              </select>
            </div>

            {/* Si el rol es cliente, mostrar selector obligatorio de cliente */}
            {Number(formData.id_rol) === 3 && (
              <div className="form-group">
                <label className="form-label" htmlFor="modal_usr_cliente">Vincular a Perfil de Cliente *</label>
                <select
                  id="modal_usr_cliente"
                  className="form-select"
                  value={formData.id_cliente}
                  onChange={(e) => setFormData({ ...formData, id_cliente: e.target.value })}
                  required
                >
                  <option value="">-- Seleccione un cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      #{c.id_cliente} - {c.nombre} ({c.tipo_cliente})
                    </option>
                  ))}
                </select>
              </div>
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
                {formSubmitting ? 'Guardando...' : editingUsuario ? 'Actualizar Usuario' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cuenta de Usuario"
        message={`¿Confirma la eliminación permanente de la cuenta de "${usuarioToDelete?.nombre}"? Esta acción revocará sus accesos de inmediato.`}
        confirmText="Eliminar Cuenta"
      />
    </div>
  );
};

