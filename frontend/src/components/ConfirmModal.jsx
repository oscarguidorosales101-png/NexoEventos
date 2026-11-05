import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.jsx';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Confirmar Acción', message, confirmText = 'Eliminar', isDanger = true }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px">
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: isDanger ? 'var(--accent-danger-bg)' : 'rgba(212, 175, 55, 0.1)',
          color: isDanger ? 'var(--accent-danger)' : 'var(--gold-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <AlertTriangle size={30} />
        </div>
        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>
          ¿Está completamente seguro?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      <div className="modal-footer" style={{ borderTop: 'none', padding: '0.5rem 0 0', justifyContent: 'center' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button 
          type="button" 
          className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

