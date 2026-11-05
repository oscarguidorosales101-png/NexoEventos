import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type = 'info', duration = 5000 } = e.detail || {};
      if (!message) return;

      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }
    };

    const handleForbidden = (e) => {
      handleToast({ detail: { message: e.detail?.message || 'No tienes permisos para realizar esta operación.', type: 'error' } });
    };

    const handleUnauthorized = (e) => {
      handleToast({ detail: { message: e.detail?.message || 'No has iniciado sesión o tu sesión ha expirado.', type: 'warning' } });
    };

    window.addEventListener('app:toast', handleToast);
    window.addEventListener('auth:forbidden', handleForbidden);
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('app:toast', handleToast);
      window.removeEventListener('auth:forbidden', handleForbidden);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '420px',
      width: '100%'
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: `1px solid ${t.type === 'error' ? 'var(--accent-danger)' : t.type === 'warning' ? 'var(--accent-warning)' : t.type === 'success' ? 'var(--accent-success)' : 'var(--gold-primary)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-md)',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div style={{
            color: t.type === 'error' ? 'var(--accent-danger)' : t.type === 'warning' ? 'var(--accent-warning)' : t.type === 'success' ? 'var(--accent-success)' : 'var(--gold-primary)',
            marginTop: '0.1rem',
            flexShrink: 0
          }}>
            {t.type === 'error' ? <AlertCircle size={20} /> : t.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
          </div>
          <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
            {t.message}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export const showToast = (message, type = 'info', duration = 5000) => {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type, duration } }));
};

