import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService.js';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  Users,
  CalendarDays,
  CheckSquare,
  Plus,
  Trash2,
  Pencil,
  Download,
  Mail,
  Phone
} from 'lucide-react';

export const ScheduleDetailDrawer = ({
  schedule,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
  isClient = false
}) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (isOpen && schedule?.id_agenda) {
      loadFullDetail(schedule.id_agenda);
      if (canManage) {
        loadCandidates();
      }
    } else {
      setDetail(null);
    }
  }, [isOpen, schedule, canManage]);

  const loadFullDetail = async (id) => {
    setLoading(true);
    try {
      const data = await scheduleService.getById(id);
      setDetail(data);
    } catch (err) {
      console.error('Error al cargar detalle de agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    try {
      const staffList = await scheduleService.getTeamCandidates();
      setCandidates(staffList || []);
    } catch (err) {
      console.error('Error al cargar candidatos de equipo:', err);
    }
  };

  const handleToggleNote = async (note) => {
    if (!detail) return;
    try {
      const updated = await scheduleService.toggleNote(note.id_nota, !note.completada);
      setDetail((prev) => ({
        ...prev,
        notas: (prev.notas || []).map((n) =>
          n.id_nota === note.id_nota ? { ...n, completada: updated.completada } : n
        )
      }));
    } catch (err) {
      console.error('Error al cambiar estado de nota:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !detail) return;

    setSavingNote(true);
    try {
      const newNote = await scheduleService.addNote(detail.id_agenda, newNoteText.trim());
      setDetail((prev) => ({
        ...prev,
        notas: [...(prev.notas || []), newNote]
      }));
      setNewNoteText('');
    } catch (err) {
      console.error('Error al agregar nota operativa:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!detail) return;
    try {
      await scheduleService.deleteNote(noteId);
      setDetail((prev) => ({
        ...prev,
        notas: (prev.notas || []).filter((n) => n.id_nota !== noteId)
      }));
    } catch (err) {
      console.error('Error al eliminar nota:', err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || !detail) return;

    setAddingMember(true);
    try {
      await scheduleService.addTeamMember(detail.id_agenda, selectedCandidate);
      await loadFullDetail(detail.id_agenda);
      setSelectedCandidate('');
    } catch (err) {
      console.error('Error al asignar integrante:', err);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!detail) return;
    try {
      await scheduleService.removeTeamMember(detail.id_agenda, userId);
      setDetail((prev) => ({
        ...prev,
        integrantes: (prev.integrantes || []).filter((m) => m.id_usuario !== userId)
      }));
    } catch (err) {
      console.error('Error al remover integrante:', err);
    }
  };

  const handleDownloadICS = async () => {
    if (!detail) return;
    try {
      await scheduleService.exportICS({ id_agenda: detail.id_agenda });
    } catch (err) {
      console.error('Error al exportar ICS:', err);
    }
  };

  if (!isOpen) return null;

  const current = detail || schedule;
  const color = current?.color_identificador || current?.color_categoria || 'var(--gold-primary)';

  // Helper para iniciales de usuario
  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="schedule-detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado del Drawer */}
        <div className="drawer-header">
          <div>
            <span
              className="drawer-category-tag"
              style={{
                borderColor: color,
                color: color,
                backgroundColor: 'rgba(212, 175, 55, 0.08)'
              }}
            >
              {current?.categoria_nombre || current?.nombre_categoria || 'Actividad'}
            </span>
            <h2 className="drawer-title">{current?.titulo}</h2>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Cerrar panel"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Cuerpo del Drawer */}
        <div className="drawer-body">
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-primary)' }}>
              <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
              <span style={{ fontSize: '0.85rem' }}>Actualizando información operativa...</span>
            </div>
          )}

          {/* Horario y Duración */}
          <div className="drawer-info-block">
            <span className="drawer-info-label">Fecha y Horario (Costa Rica UTC-6)</span>
            <div className="drawer-info-value" style={{ fontWeight: 600, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={15} style={{ color: 'var(--gold-primary)' }} />
              <span>
                {current?.fecha_inicio ? current.fecha_inicio.replace('T', ' ').substring(0, 16) : 'N/D'}
                {' — '}
                {current?.fecha_fin ? current.fecha_fin.replace('T', ' ').substring(11, 16) : 'N/D'}
              </span>
            </div>
          </div>

          {/* Ubicación */}
          {current?.ubicacion && (
            <div className="drawer-info-block">
              <span className="drawer-info-label">Ubicación / Espacio</span>
              <div className="drawer-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} style={{ color: 'var(--gold-primary)' }} />
                <span>{current.ubicacion}</span>
              </div>
            </div>
          )}

          {/* Descripción */}
          {current?.descripcion && (
            <div className="drawer-info-block">
              <span className="drawer-info-label">Descripción Operativa</span>
              <div className="drawer-info-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FileText size={15} style={{ color: 'var(--text-muted)', marginTop: '0.2rem', flexShrink: 0 }} />
                <span>{current.descripcion}</span>
              </div>
            </div>
          )}

          {/* Persona Responsable (PIC) */}
          <div className="drawer-info-block" style={{ border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', backgroundColor: 'rgba(212, 175, 55, 0.04)' }}>
            <span className="drawer-info-label" style={{ color: 'var(--gold-primary)' }}>
              Persona Responsable (PIC)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                  color: 'var(--gold-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {getInitials(current?.responsable_nombre || current?.nombre_responsable)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {current?.responsable_nombre || current?.nombre_responsable || 'No asignado'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textTransform: 'capitalize' }}>
                  {current?.responsable_rol || current?.rol_responsable || 'Staff Operativo'}
                </div>
                {(current?.responsable_correo || current?.correo_responsable) && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                    <Mail size={11} />
                    <span>{current?.responsable_correo || current?.correo_responsable}</span>
                  </div>
                )}
                {current?.telefono_cliente && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={11} />
                    <span>{current.telefono_cliente}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Evento Comercial Asociado */}
          {current?.id_evento && (
            <div className="drawer-info-block">
              <span className="drawer-info-label">Evento Comercial Vinculado</span>
              <div className="drawer-info-value" style={{ color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={16} />
                <span>
                  {current.nombre_evento || current.evento_nombre ? `${current.nombre_evento || current.evento_nombre} (ID #${current.id_evento})` : `Evento #${current.id_evento}`}
                  {current.nombre_cliente && ` — Cliente: ${current.nombre_cliente}`}
                </span>
              </div>
            </div>
          )}

          {/* Integrantes del Equipo (Oculto para Clientes) */}
          {!isClient && (
            <div>
              <div className="drawer-section-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} />
                  <span>Equipo Operativo Asignado</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({detail?.integrantes?.length || 0} integrantes)
                </span>
              </div>

              <div className="team-members-chips">
                {(detail?.integrantes || []).length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No hay integrantes adicionales asignados a esta actividad.
                  </span>
                ) : (
                  detail.integrantes.map((member) => (
                    <div key={member.id_usuario} className="team-chip" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(212, 175, 55, 0.2)',
                          color: 'var(--gold-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}
                      >
                        {getInitials(member.nombre)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{member.nombre}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{member.rol || member.rol_nombre}</span>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          className="team-chip-remove"
                          onClick={() => handleRemoveMember(member.id_usuario)}
                          title="Remover integrante"
                          style={{ marginLeft: '0.25rem', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {canManage && candidates.length > 0 && (
                <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <select
                    className="form-select"
                    value={selectedCandidate}
                    onChange={(e) => setSelectedCandidate(e.target.value)}
                    style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                  >
                    <option value="">+ Seleccionar personal autorizado para asignar...</option>
                    {candidates
                      .filter((c) => !(detail?.integrantes || []).some((m) => m.id_usuario === c.id_usuario))
                      .map((c) => (
                        <option key={c.id_usuario} value={c.id_usuario}>
                          {c.nombre} ({c.rol_nombre || c.rol})
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={!selectedCandidate || addingMember}
                  >
                    {addingMember ? 'Asignando...' : 'Asignar'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Checklist de Notas Operativas (Oculto para Clientes) */}
          {!isClient && (
            <div>
              <div className="drawer-section-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckSquare size={14} />
                  <span>Notas Operativas & Tareas</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({detail?.notas?.filter((n) => n.completada).length || 0} / {detail?.notas?.length || 0} completadas)
                </span>
              </div>

              <div className="notes-checklist">
                {(detail?.notas || []).length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Sin notas ni pendientes operativos registrados.
                  </span>
                ) : (
                  detail.notas.map((note) => (
                    <div key={note.id_nota} className={`note-item ${note.completada ? 'completada' : ''}`}>
                      <label className="note-left">
                        <input
                          type="checkbox"
                          className="note-checkbox"
                          checked={Boolean(note.completada)}
                          onChange={() => handleToggleNote(note)}
                        />
                        <span className="note-text">{note.texto || note.descripcion}</span>
                      </label>
                      {canManage && (
                        <button
                          type="button"
                          className="note-delete-btn"
                          onClick={() => handleDeleteNote(note.id_nota)}
                          title="Eliminar nota"
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {canManage && (
                <form onSubmit={handleAddNote} className="add-note-inline-form">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nueva nota o tarea operativa..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-gold btn-sm"
                    disabled={!newNoteText.trim() || savingNote}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} />
                    <span>{savingNote ? 'Guardando...' : 'Agregar'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Acciones del Footer */}
        <div className="drawer-actions-footer">
          <button
            type="button"
            className="btn btn-outline-gold btn-sm"
            onClick={handleDownloadICS}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>Descargar .ICS</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canManage && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onEdit(current)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Pencil size={14} />
                <span>Editar</span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(current.id_agenda)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
