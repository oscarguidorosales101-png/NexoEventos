import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const RutaProtegida = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--gold-primary)', fontSize: '0.9rem' }}>Verificando credenciales corporativas...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.rol?.toLowerCase();
    const hasPermission = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!hasPermission) {
      return (
        <div style={{ padding: '3rem', maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <div className="card" style={{ borderColor: 'var(--accent-danger)' }}>
            <h2 style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }}>403 — Acceso Restringido</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Su cuenta con rol <strong>{user?.rol}</strong> no posee los privilegios necesarios para acceder a este módulo administrativo.
            </p>
            <a href="/dashboard" className="btn btn-primary">Volver al Panel Principal</a>
          </div>
        </div>
      );
    }
  }

  return children;
};

