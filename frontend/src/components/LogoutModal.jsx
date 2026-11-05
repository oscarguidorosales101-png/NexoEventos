import React from 'react';
import { LogOut } from 'lucide-react';
import { Modal } from './Modal.jsx';

export const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cerrar Sesión" maxWidth="440px">
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(212, 175, 55, 0.12)',
          border: '1px solid var(--border-gold)',
          color: 'var(--gold-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <LogOut size={26} />
        </div>
        <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.75rem', fontWeight: 600 }}>
          ¿Estás seguro de que deseas cerrar sesión?
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0.5rem' }}>
          Tu sesión actual se cerrará y tendrás que iniciar sesión nuevamente para acceder al sistema.
        </p>
      </div>
      <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '1rem 0 0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button 
          type="button" 
          className="btn btn-primary"
          style={{ background: 'var(--gold-gradient)', color: '#0A0C10', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={onConfirm}
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </Modal>
  );
};

