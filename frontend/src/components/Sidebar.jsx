import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Calendar,
  Layers,
  UserCheck,
  Shield,
  User,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, isSupervisor, isClient } = useAuth();

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: isActive ? 'var(--gold-primary)' : 'var(--text-muted)',
    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--gold-primary)' : '3px solid transparent',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    marginBottom: '0.25rem'
  });

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 68px)'
    }}>
      <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-dim)'
        }}>
          Navegación Principal
        </span>
      </div>

      <nav style={{ flex: 1 }}>
        <NavLink to="/dashboard" style={navItemStyle}>
          <LayoutDashboard size={18} />
          <span>Panel de Control</span>
        </NavLink>

        {/* Módulo de Calendario y Agendas en Tiempo Real */}
        <NavLink to="/calendario" style={navItemStyle}>
          <CalendarDays size={18} />
          <span>Calendario y Agenda</span>
        </NavLink>

        {/* Módulos Operativos para Admin y Supervisor */}
        {(isAdmin || isSupervisor) && (
          <>
            <NavLink to="/clientes" style={navItemStyle}>
              <Users size={18} />
              <span>Clientes</span>
            </NavLink>

            <NavLink to="/servicios" style={navItemStyle}>
              <Briefcase size={18} />
              <span>Servicios</span>
            </NavLink>

            <NavLink to="/eventos" style={navItemStyle}>
              <Calendar size={18} />
              <span>Eventos</span>
            </NavLink>

            <NavLink to="/detalle-eventos" style={navItemStyle}>
              <Layers size={18} />
              <span>Detalle de Eventos</span>
            </NavLink>
          </>
        )}

        {/* Vista para Clientes */}
        {isClient && (
          <>
            <NavLink to="/portal-cliente" style={navItemStyle}>
              <Sparkles size={18} />
              <span>Solicitar Evento</span>
            </NavLink>

            <NavLink to="/eventos" style={navItemStyle}>
              <Calendar size={18} />
              <span>Mis Eventos</span>
            </NavLink>

            <NavLink to="/servicios" style={navItemStyle}>
              <Briefcase size={18} />
              <span>Servicios Disponibles</span>
            </NavLink>
          </>
        )}

        {/* Módulos de Administración y Seguridad */}
        <div style={{ margin: '1.5rem 0 0.5rem', padding: '0 0.5rem' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-dim)'
          }}>
            {isAdmin ? 'Administración' : isSupervisor ? 'Operaciones' : 'Mi Cuenta'}
          </span>
        </div>

        {/* EXCLUSIVO PARA ADMINISTRADOR: Usuarios y Roles */}
        {isAdmin && (
          <>
            <NavLink to="/usuarios" style={navItemStyle}>
              <UserCheck size={18} />
              <span>Gestión de Usuarios</span>
            </NavLink>

            <NavLink to="/roles" style={navItemStyle}>
              <Shield size={18} />
              <span>Catálogo de Roles</span>
            </NavLink>
          </>
        )}

        <NavLink to="/perfil" style={navItemStyle}>
          <User size={18} />
          <span>Mi Perfil</span>
        </NavLink>
      </nav>

      {/* Pie del menú con rol */}
      <div style={{
        padding: '0.875rem',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        marginTop: '1rem'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
          Rol en Sesión:
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gold-primary)', textTransform: 'capitalize' }}>
          {user?.rol}
        </div>
      </div>
    </aside>
  );
};
