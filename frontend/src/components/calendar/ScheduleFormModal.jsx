import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService.js';
import { eventoService } from '../../services/eventoService.js';

export const ScheduleFormModal = ({
  isOpen,
  onClose,
  onSave,
  scheduleToEdit = null,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    id_categoria: '',
    id_evento: '',
    id_responsable: '',
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
    integrantes: []
  });

  const [candidates, setCandidates] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialOptions();
      if (scheduleToEdit) {
        // Formatear fechas para input datetime-local: YYYY-MM-DDTHH:mm
        const formatForInput = (dt) => {
          if (!dt) return '';
          return dt.replace(' ', 'T').substring(0, 16);
        };

        setFormData({
          id_categoria: scheduleToEdit.id_categoria || '',
          id_evento: scheduleToEdit.id_evento || '',
          id_responsable: scheduleToEdit.id_responsable || '',
          titulo: scheduleToEdit.titulo || '',
          descripcion: scheduleToEdit.descripcion || '',
          fecha_inicio: formatForInput(scheduleToEdit.fecha_inicio),
          fecha_fin: formatForInput(scheduleToEdit.fecha_fin),
          ubicacion: scheduleToEdit.ubicacion || '',
          integrantes: (scheduleToEdit.integrantes || []).map((i) => i.id_usuario)
        });
      } else {
        // Inicializar con valores por defecto
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0);

        const toInputString = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${y}-${m}-${day}T${h}:${min}`;
        };

        setFormData({
          id_categoria: categories[0]?.id_categoria || '',
          id_evento: '',
          id_responsable: '',
          titulo: '',
          descripcion: '',
          fecha_inicio: toInputString(start),
          fecha_fin: toInputString(end),
          ubicacion: '',
          integrantes: []
        });
      }
      setConflictError(null);
    }
  }, [isOpen, scheduleToEdit, categories]);

  const loadInitialOptions = async () => {
    try {
      const [staffList, eventList] = await Promise.all([
        scheduleService.getTeamCandidates().catch(() => []),
        eventoService.getAll().catch(() => [])
      ]);
      setCandidates(staffList || []);
      setEventos(eventList || []);
    } catch (err) {
      console.error('Error al cargar datos auxiliares para el formulario:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (conflictError) setConflictError(null);
  };

  const handleMemberToggle = (userId) => {
    setFormData((prev) => {
      const current = prev.integrantes || [];
      if (current.includes(userId)) {
        return { ...prev, integrantes: current.filter((id) => id !== userId) };
      } else {
        return { ...prev, integrantes: [...current, userId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError(null);

    if (!formData.id_categoria) {
      alert('Debe seleccionar una categoría de agenda.');
      return;
    }
    if (!formData.titulo.trim()) {
      alert('El título es requerido.');
      return;
    }
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      alert('Las fechas y horas de inicio y fin son obligatorias.');
      return;
    }

    if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_fin)) {
      alert('La fecha y hora de fin debe ser posterior a la de inicio.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        id_categoria: parseInt(formData.id_categoria, 10),
        id_evento: formData.id_evento ? parseInt(formData.id_evento, 10) : null,
        id_responsable: formData.id_responsable ? parseInt(formData.id_responsable, 10) : null,
        fecha_inicio: formData.fecha_inicio.replace('T', ' ') + ':00',
        fecha_fin: formData.fecha_fin.replace('T', ' ') + ':00'
      };

      await onSave(payload, scheduleToEdit?.id_agenda);
      onClose();
    } catch (err) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        setConflictError(err.message || 'Existe un conflicto de horario para el responsable o algún integrante.');
      } else {
        alert(err.message || 'Error al guardar la agenda.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <span>📅 {scheduleToEdit ? 'Editar Actividad de Agenda' : 'Programar Nueva Actividad'}</span>
          </h3>
          <button type="button" className="drawer-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Banner de Conflicto 409 */}
            {conflictError && (
              <div className="conflict-alert-box">
                <div className="conflict-alert-title">
                  <span>⚠️ Solapamiento de Horario Detectado</span>
                </div>
                <div className="conflict-alert-desc">
                  {conflictError}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Título de la Actividad *</label>
              <input
                type="text"
                name="titulo"
                className="form-control"
                placeholder="Ej. Revisión técnica de iluminación y audio"
                value={formData.titulo}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select
                  name="id_categoria"
                  className="form-select"
                  value={formData.id_categoria}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione categoría...</option>
                  {categories.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Evento Comercial Vinculado</label>
                <select
                  name="id_evento"
                  className="form-select"
                  value={formData.id_evento}
                  onChange={handleChange}
                >
                  <option value="">(Ninguno — Actividad General)</option>
                  {eventos.map((ev) => (
                    <option key={ev.id_evento} value={ev.id_evento}>
                      #{ev.id_evento} - {ev.nombre_evento} ({ev.cliente_nombre})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Fecha y Hora de Inicio *</label>
                <input
                  type="datetime-local"
                  name="fecha_inicio"
                  className="form-control"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha y Hora de Fin *</label>
                <input
                  type="datetime-local"
                  name="fecha_fin"
                  className="form-control"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Responsable Principal (PIC)</label>
                <select
                  name="id_responsable"
                  className="form-select"
                  value={formData.id_responsable}
                  onChange={handleChange}
                >
                  <option value="">Seleccione responsable...</option>
                  {candidates.map((c) => (
                    <option key={c.id_usuario} value={c.id_usuario}>
                      {c.nombre} ({c.rol_nombre})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ubicación / Espacio</label>
                <input
                  type="text"
                  name="ubicacion"
                  className="form-control"
                  placeholder="Ej. Salón Cristal o Sala Ejecutiva B"
                  value={formData.ubicacion}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción Operativa</label>
              <textarea
                name="descripcion"
                className="form-control"
                rows="3"
                placeholder="Instrucciones clave, requerimientos logísticos..."
                value={formData.descripcion}
                onChange={handleChange}
              />
            </div>

            {/* Asignación de Integrantes del Equipo */}
            <div className="form-group">
              <label className="form-label">
                Integrantes del Equipo ({formData.integrantes.length} seleccionados)
              </label>
              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  backgroundColor: 'var(--bg-input)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.4rem'
                }}
              >
                {candidates.map((c) => {
                  const isChecked = formData.integrantes.includes(c.id_usuario);
                  return (
                    <label
                      key={c.id_usuario}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: isChecked ? 'var(--gold-primary)' : 'var(--text-main)',
                        padding: '0.2rem'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleMemberToggle(c.id_usuario)}
                        style={{ accentColor: 'var(--gold-primary)' }}
                      />
                      <span>{c.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Guardando...' : scheduleToEdit ? 'Actualizar Agenda' : 'Crear Agenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

