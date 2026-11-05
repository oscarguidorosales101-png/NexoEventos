import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, User, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoutModal } from './LogoutModal.jsx';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header style={{
      height: '68px',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Logotipo y Título de Marca */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'var(--gold-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0A0C10',
          boxShadow: 'var(--shadow-gold)'
        }}>
          <Sparkles size={22} />
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em', color: '#FFFFFF' }}>
            NEXO<span style={{ color: 'var(--gold-primary)' }}>EVENTOS</span>
          </span>
          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Plataforma Administrativa
          </span>
        </div>
      </Link>

      {/* Perfil de Usuario y Cierre de Sesión */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-primary)'
          }}>
            <User size={18} />
          </div>
          <div style={{ display: 'none', md: 'block', textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {user?.nombre}
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <span className={`badge badge-rol-${user?.rol?.toLowerCase()}`}>
                {user?.rol}
              </span>
            </div>
          </div>
        </Link>

        <button 
          onClick={() => setShowLogoutModal(true)}
          className="btn btn-secondary btn-sm"
          title="Cerrar sesión"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>

      {/* Modal de Confirmación de Cierre de Sesión */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </header>
  );
};

