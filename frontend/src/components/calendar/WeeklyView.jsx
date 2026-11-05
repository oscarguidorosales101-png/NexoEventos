import React, { useState } from 'react';
import { User, Users, MapPin, CheckSquare, Clock } from 'lucide-react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 AM to 20:00 (8:00 PM)

const formatTimeLabel = (h) => {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;
};

export const WeeklyView = ({
  days = [], // Array of 7 days: { date: Date, dateStr: 'YYYY-MM-DD', dayName: 'Lunes', isToday: boolean }
  schedules = [],
  onSelectSchedule,
  onReschedule,
  canManage = false
}) => {
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Mapear agendas por fecha YYYY-MM-DD y hora de inicio
  const getSchedulesForSlot = (dateStr, hour) => {
    return schedules.filter((s) => {
      if (!s.fecha_inicio) return false;
      const sDate = s.fecha_inicio.substring(0, 10);
      const sHour = parseInt(s.fecha_inicio.substring(11, 13), 10);
      return sDate === dateStr && sHour === hour;
    });
  };

  const handleDragStart = (e, schedule) => {
    if (!canManage) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: schedule.id_agenda,
      start: schedule.fecha_inicio,
      end: schedule.fecha_fin
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, slotKey) => {
    if (!canManage) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotKey) {
      setDragOverSlot(slotKey);
    }
  };

  const handleDragLeave = (slotKey) => {
    if (dragOverSlot === slotKey) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = async (e, dateStr, hour) => {
    if (!canManage) return;
    e.preventDefault();
    setDragOverSlot(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const { id, start, end } = JSON.parse(rawData);
      
      const originalStart = new Date(start);
      const originalEnd = new Date(end);
      const durationMs = originalEnd.getTime() - originalStart.getTime();

      const newStart = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`);
      const newEnd = new Date(newStart.getTime() + (durationMs > 0 ? durationMs : 3600000));

      const formatISO = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${day} ${h}:${min}:00`;
      };

      await onReschedule(id, formatISO(newStart), formatISO(newEnd));
    } catch (err) {
      console.error('Error al procesar arrastre de agenda:', err);
    }
  };

  return (
    <div className="weekly-calendar-wrapper">
      <div className="weekly-grid">
        {/* Fila de Encabezados de Días (Lunes a Domingo) */}
        <div className="weekly-header-row">
          <div className="weekly-corner-cell">HORA</div>
          {days.map((day) => (
            <div
              key={day.dateStr}
              className={`weekly-day-header ${day.isToday ? 'today' : ''}`}
            >
              <div className="weekly-day-name">{day.dayName}</div>
              <div className="weekly-day-date">{day.dayNumber}</div>
            </div>
          ))}
        </div>

        {/* Filas por Hora (08:00 AM - 08:00 PM) */}
        {HOURS.map((hour) => (
          <div key={hour} className="weekly-body-row">
            <div className="weekly-time-cell">{formatTimeLabel(hour)}</div>

            {days.map((day) => {
              const slotKey = `${day.dateStr}_${hour}`;
              const slotSchedules = getSchedulesForSlot(day.dateStr, hour);
              const isOver = dragOverSlot === slotKey;

              return (
                <div
                  key={slotKey}
                  className={`weekly-slot-cell ${isOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, slotKey)}
                  onDragLeave={() => handleDragLeave(slotKey)}
                  onDrop={(e) => handleDrop(e, day.dateStr, hour)}
                >
                  {slotSchedules.map((schedule) => {
                    const color = schedule.color_identificador || 'var(--gold-primary)';
                    const startStr = schedule.fecha_inicio ? schedule.fecha_inicio.substring(11, 16) : '';
                    const endStr = schedule.fecha_fin ? schedule.fecha_fin.substring(11, 16) : '';
                    const totalIntegrantes = schedule.integrantes ? schedule.integrantes.length : (schedule.total_integrantes || 0);

                    return (
                      <div
                        key={schedule.id_agenda}
                        className="schedule-card-item"
                        style={{ '--item-color': color }}
                        draggable={canManage}
                        onDragStart={(e) => handleDragStart(e, schedule)}
                        onClick={() => onSelectSchedule(schedule)}
                        title={`${schedule.titulo} (${startStr} - ${endStr}) | Responsable: ${schedule.responsable_nombre || 'N/A'}`}
                      >
                        <div className="schedule-item-time">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={10} />
                            {startStr} - {endStr}
                          </span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.05rem 0.3rem',
                              borderRadius: '2px',
                              backgroundColor: 'rgba(212, 175, 55, 0.12)',
                              color
                            }}
                          >
                            {schedule.categoria_nombre}
                          </span>
                        </div>

                        <div className="schedule-item-title">{schedule.titulo}</div>

                        {/* Responsable Principal (PIC) destacado */}
                        {schedule.responsable_nombre && (
                          <div className="schedule-item-pic" style={{ color: 'var(--gold-light)', fontWeight: 600 }}>
                            <User size={11} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                            <span>{schedule.responsable_nombre}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                          {totalIntegrantes > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }} title="Equipo asignado">
                              <Users size={10} style={{ color: 'var(--accent-info)' }} />
                              +{totalIntegrantes}
                            </span>
                          )}

                          {schedule.total_notas > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', marginLeft: totalIntegrantes > 0 ? '0' : 'auto' }} title="Notas operativas">
                              <CheckSquare size={10} />
                              {schedule.total_notas}
                            </span>
                          )}

                          {schedule.ubicacion && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={schedule.ubicacion}>
                              <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
                              {schedule.ubicacion}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
