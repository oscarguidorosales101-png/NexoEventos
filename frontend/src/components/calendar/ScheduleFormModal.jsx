import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService.js';
import { eventoService } from '../../services/eventoService.js';
import { Calendar, X, AlertTriangle, Users, User, MapPin, FileText, Check } from 'lucide-react';

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
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialOptions();
      if (scheduleToEdit) {
        const formatForInput = (dt) => {
          if (!dt) return '';
          return dt.replace(' ', 'T').substring(0, 16);
        };

        setFormData({
          id_categoria: scheduleToEdit.id_categoria || '',
          id_evento: scheduleToEdit.id_evento ? String(scheduleToEdit.id_evento) : '',
          id_responsable: scheduleToEdit.id_responsable ? String(scheduleToEdit.id_responsable) : '',
          titulo: scheduleToEdit.titulo || '',
          descripcion: scheduleToEdit.descripcion || '',
          fecha_inicio: formatForInput(scheduleToEdit.fecha_inicio),
          fecha_fin: formatForInput(scheduleToEdit.fecha_fin),
          ubicacion: scheduleToEdit.ubicacion || '',
          integrantes: (scheduleToEdit.integrantes || []).map((i) => i.id_usuario)
        });
      } else {
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
          id_categoria: categories[0]?.id_categoria ? String(categories[0].id_categoria) : '',
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
    setLoadingOptions(true);
    try {
      const [staffList, eventList] = await Promise.all([
        scheduleService.getTeamCandidates().catch((err) => {
          console.error('Error al cargar candidatos de equipo:', err);
          return [];
        }),
        eventoService.getAll().catch((err) => {
          console.error('Error al cargar eventos comerciales:', err);
          return [];
        })
      ]);

      setCandidates(staffList || []);
      setEventos(eventList || []);

      // Si no hay responsable seleccionado y hay candidatos disponibles, asignar el primero por defecto
      if (!scheduleToEdit && staffList && staffList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          id_responsable: prev.id_responsable || String(staffList[0].id_usuario)
        }));
      }
    } catch (err) {
      console.error('Error al cargar datos auxiliares del modal:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Si selecciona un evento comercial, verificar si tiene ubicación sugerida
      if (name === 'id_evento' && value) {
        const ev = eventos.find((item) => String(item.id_evento) === String(value));
        if (ev && ev.ubicacion && !prev.ubicacion) {
          updated.ubicacion = ev.ubicacion;
        }
      }

      return updated;
    });

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
    if (!formData.id_responsable) {
      alert('Debe seleccionar un responsable principal (PIC).');
      return;
    }
    if (!formData.titulo.trim()) {
      alert('El título de la actividad es obligatorio.');
      return;
    }
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      alert('Las fechas y horas de inicio y fin son obligatorias.');
      return;
    }
    if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_fin)) {
      alert('La fecha y hora de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    if (!formData.ubicacion.trim()) {
      alert('La ubicación es obligatoria.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        id_categoria: parseInt(formData.id_categoria, 10),
        id_evento: formData.id_evento ? parseInt(formData.id_evento, 10) : null,
        id_responsable: parseInt(formData.id_responsable, 10),
        fecha_inicio: formData.fecha_inicio.replace('T', ' ') + ':00',
        fecha_fin: formData.fecha_fin.replace('T', ' ') + ':00',
        teamUserIds: formData.integrantes
      };

      await onSave(payload, scheduleToEdit?.id_agenda);
      onClose();
    } catch (err) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        const reasonMsg = err.data?.error?.details?.reason || err.message || 'Existe un conflicto de horario para el responsable o algún integrante.';
        setConflictError(reasonMsg);
      } else {
        alert(err.message || 'Error al guardar la agenda.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Determinar si la categoría actualmente seleccionada es la principal (id_categoria = 1 / 'Event')
  const isMainEventCategory = Number(formData.id_categoria) === 1;

  // Filtrar eventos aprobados/confirmados y que cumplan con la regla de agenda principal única
  const availableEvents = eventos.filter((ev) => {
    // Si la agenda está en edición y este evento ya estaba asignado a ella, conservarlo
    if (scheduleToEdit && String(ev.id_evento) === String(scheduleToEdit.id_evento)) {
      return true;
    }
    // Solo eventos en estado confirmado o completado (excluye pendientes y cancelados)
    if (ev.estado !== 'confirmado' && ev.estado !== 'completado') {
      return false;
    }
    // Si es categoría principal (Event), excluir los eventos que ya tienen una agenda principal
    if (isMainEventCategory && (ev.tiene_agenda_principal === 1 || ev.tiene_agenda_principal === true)) {
      return false;
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          height: '88vh',
          maxHeight: '780px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Encabezado Fijo del Modal */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h3 className="modal-title">
            <Calendar size={20} style={{ color: 'var(--gold-primary)' }} />
            <span>{scheduleToEdit ? 'Editar Actividad de Agenda' : 'Programar Nueva Actividad'}</span>
          </h3>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Cerrar modal"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario con Scroll Central Independiente */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div
            className="modal-body"
            style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Banner de Conflicto 409 */}
            {conflictError && (
              <div className="conflict-alert-box">
                <div className="conflict-alert-title">
                  <AlertTriangle size={18} style={{ color: 'var(--accent-danger)' }} />
                  <span>Solapamiento de Horario Detectado</span>
                </div>
                <div className="conflict-alert-desc">
                  {conflictError}
                </div>
              </div>
            )}

            {/* Título de la Actividad */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Título de la Actividad *</label>
              <input
                type="text"
                name="titulo"
                className="form-control"
                placeholder="Ej. Revisión técnica de iluminación y sonido"
                value={formData.titulo}
                onChange={handleChange}
                required
              />
            </div>

            {/* Categoría y Evento Comercial */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Categoría de Actividad *</label>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Evento Comercial Vinculado
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'none', marginLeft: '0.5rem' }}>
                    (Eventos aprobados)
                  </span>
                </label>
                <select
                  name="id_evento"
                  className="form-select"
                  value={formData.id_evento}
                  onChange={handleChange}
                >
                  <option value="">(Ninguno — Actividad General sin vincular)</option>
                  {availableEvents.map((ev) => (
                    <option key={ev.id_evento} value={ev.id_evento}>
                      #{ev.id_evento} — {ev.nombre} | {ev.nombre_cliente || 'Cliente'} [{ev.estado.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fechas y Horas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
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

            {/* Responsable Principal y Ubicación */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Responsable Principal (PIC) *
                </label>
                <select
                  name="id_responsable"
                  className="form-select"
                  value={formData.id_responsable}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione responsable...</option>
                  {candidates.map((c) => (
                    <option key={c.id_usuario} value={c.id_usuario}>
                      {c.nombre} ({c.rol_nombre || c.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ubicación / Espacio *</label>
                <input
                  type="text"
                  name="ubicacion"
                  className="form-control"
                  placeholder="Ej. Salón Cristal o Hacienda El Paraíso"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Descripción Operativa */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Descripción Operativa</label>
              <textarea
                name="descripcion"
                className="form-control"
                rows="2"
                placeholder="Instrucciones clave, requerimientos logísticos..."
                value={formData.descripcion}
                onChange={handleChange}
              />
            </div>

            {/* Asignación de Integrantes del Equipo */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} style={{ color: 'var(--gold-primary)' }} />
                  <span>Integrantes del Equipo</span>
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-primary)' }}>
                  {formData.integrantes.length} seleccionado(s)
                </span>
              </div>

              <div
                style={{
                  minHeight: '140px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-input)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.5rem'
                }}
              >
                {candidates.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.5rem' }}>
                    {loadingOptions ? 'Cargando personal autorizado...' : 'No hay integrantes disponibles.'}
                  </div>
                ) : (
                  candidates.map((c) => {
                    const isChecked = formData.integrantes.includes(c.id_usuario);
                    return (
                      <label
                        key={c.id_usuario}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '4px',
                          border: isChecked ? '1px solid var(--border-gold)' : '1px solid transparent',
                          backgroundColor: isChecked ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          color: isChecked ? 'var(--gold-primary)' : 'var(--text-main)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMemberToggle(c.id_usuario)}
                          style={{ accentColor: 'var(--gold-primary)', width: '15px', height: '15px' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {c.nombre}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {c.rol_nombre || c.rol}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Pie Fijo del Modal con Botones Siempre Accesibles */}
          <div className="modal-footer" style={{ flexShrink: 0, padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : scheduleToEdit ? 'Actualizar Agenda' : 'Programar Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
