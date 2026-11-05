import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Lock, Mail, User, Phone, MapPin, Building, AlertCircle, CheckCircle } from 'lucide-react';

export const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    tipo_cliente: 'persona',
    telefono: '',
    direccion: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password.length < 8) {
      setError('La contraseña debe tener como mínimo 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      setSuccess('¡Registro completado exitosamente! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '2rem 1rem',
      background: 'radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, rgba(11, 13, 19, 1) 75%)'
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--gold-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0A0C10',
            boxShadow: 'var(--shadow-gold)',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={26} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
            Registro de Cliente — NexoEventos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Cree su perfil para solicitar y supervisar la planificación de sus eventos
          </p>
        </div>

        {/* Tarjeta */}
        <div className="card card-gold">
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

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="nombre">Nombre Completo o Razón Social</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Ej. Inversiones Andinas S.A."
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                  <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tipo_cliente">Tipo de Cliente</label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="tipo_cliente"
                    name="tipo_cliente"
                    className="form-select"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.tipo_cliente}
                    onChange={handleChange}
                  >
                    <option value="persona">Persona Natural</option>
                    <option value="empresa">Empresa / Corporativo</option>
                  </select>
                  <Building size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="telefono">Teléfono de Contacto</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="telefono"
                    name="telefono"
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="+57 300 123 4567"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="direccion">Dirección o Sede</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Calle 100 # 15-20, Bogotá"
                    value={formData.direccion}
                    onChange={handleChange}
                  />
                  <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="correo">Correo Electrónico (Acceso)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="contacto@empresa.com"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="password">Contraseña (Mínimo 8 caracteres)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '1.2rem', height: '1.2rem' }}></div>
                  <span>Registrando cuenta...</span>
                </div>
              ) : (
                'Crear Cuenta de Cliente'
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            ¿Ya tiene una cuenta activa?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

