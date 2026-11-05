import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Lock, Mail, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(correo, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.data?.message || err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (demoMail, demoPass) => {
    setCorreo(demoMail);
    setPassword(demoPass);
    setError(null);
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
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Cabecera del Login */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'var(--gold-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0A0C10',
            boxShadow: 'var(--shadow-gold)',
            marginBottom: '1rem'
          }}>
            <Sparkles size={30} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
            NEXO<span style={{ color: 'var(--gold-primary)' }}>EVENTOS</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Plataforma Administrativa de Eventos Sociales y Corporativos
          </p>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="card card-gold">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--gold-primary)', textAlign: 'center' }}>
            Acceso al Sistema
          </h2>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="correo">
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="correo"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="usuario@nexoeventos.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
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
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Accesos Rápidos de Demostración para Evaluación */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Credenciales de Demostración Académica
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCredentials('admin@nexoeventos.com', 'Admin1234*')}
                title="Rol: Administrador (Control total)"
              >
                Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCredentials('supervisor@nexoeventos.com', 'Supervisor1234*')}
                title="Rol: Supervisor (Operativo)"
              >
                Supervisor
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCredentials('cliente@empresa.com', 'Cliente1234*')}
                title="Rol: Cliente (Vista propia)"
              >
                Cliente
              </button>
            </div>
          </div>

          {/* Enlace a Registro */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            ¿No tiene cuenta corporativa?{' '}
            <Link to="/registro" style={{ fontWeight: 600 }}>
              Registrarse como cliente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

