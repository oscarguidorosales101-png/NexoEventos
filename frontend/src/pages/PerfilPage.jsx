import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/authService.js';
import { User, Mail, Shield, Lock, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export const PerfilPage = () => {
  const { user, refreshUser } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password) {
      if (password.length < 8) {
        setError('La nueva contraseña debe tener como mínimo 8 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim()
      };
      if (password) {
        payload.password = password;
      }

      await authService.updateProfile(payload);
      await refreshUser();
      setSuccess('Perfil de usuario actualizado correctamente');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={24} style={{ color: 'var(--gold-primary)' }} />
          <span>Mi Perfil Corporativo</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Información de la cuenta, credenciales de acceso y datos de contacto
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Resumen de Cuenta */}
        <div className="card card-gold" style={{ textAlign: 'center' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-hover)',
            border: '2px solid var(--gold-primary)',
            color: 'var(--gold-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <User size={36} />
          </div>

          <h2 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
            {user?.nombre}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            {user?.correo}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
            <span className={`badge badge-rol-${user?.rol?.toLowerCase()}`}>
              <Shield size={12} />
              {user?.rol}
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', textAlign: 'left', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>ID de Usuario:</span>
              <strong style={{ color: 'var(--gold-primary)' }}>#{user?.id_usuario}</strong>
            </div>

            {user?.id_cliente && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Perfil Cliente:</span>
                <strong style={{ color: 'var(--text-main)' }}>#{user?.id_cliente} - {user?.tipo_cliente}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Modificación */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', color: 'var(--gold-primary)', marginBottom: '1.25rem' }}>
            Actualizar Datos y Credenciales
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="perf_nombre">Nombre Completo *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="perf_nombre"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="perf_correo">Correo Electrónico (No modificable)</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="perf_correo"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', opacity: 0.7, cursor: 'not-allowed' }}
                  value={user?.correo || ''}
                  disabled
                />
                <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            {user?.id_cliente && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="perf_tel">Teléfono de Contacto</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="perf_tel"
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Actualizar teléfono..."
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                    <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="perf_dir">Dirección o Sede</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="perf_dir"
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Actualizar dirección..."
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                    />
                    <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gold-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cambiar Contraseña (Opcional)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="perf_pass">Nueva Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="perf_pass"
                      type="password"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="perf_pass_conf">Confirmar Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="perf_pass_conf"
                      type="password"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Repita la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}
            >
              {loading ? 'Guardando Cambios...' : 'Actualizar Mi Perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

