import React from 'react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 AM to 20:00 (8:00 PM)

const formatTimeLabel = (h) => {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;
};

export const DailyView = ({
  currentDate,
  schedules = [],
  onSelectSchedule
}) => {
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const getSchedulesForHour = (hour) => {
    return schedules.filter((s) => {
      if (!s.fecha_inicio || !s.fecha_inicio.startsWith(dateStr)) return false;
      const sHour = parseInt(s.fecha_inicio.substring(11, 13), 10);
      return sHour === hour;
    });
  };

  return (
    <div className="daily-calendar-wrapper">
      <div className="daily-timeline">
        {HOURS.map((hour) => {
          const hourSchedules = getSchedulesForHour(hour);
          const hasConflict = hourSchedules.length > 1;

          return (
            <div key={hour} className="daily-timeline-row">
              <div className="daily-hour-badge">{formatTimeLabel(hour)}</div>

              <div className="daily-schedules-container">
                {hasConflict && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    ⚠️ {hourSchedules.length} actividades programadas en esta franja horaria
                  </div>
                )}

                {hourSchedules.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.35rem 0' }}>
                    Sin actividades programadas
                  </div>
                ) : (
                  hourSchedules.map((schedule) => {
                    const color = schedule.color_identificador || 'var(--gold-primary)';
                    const startStr = schedule.fecha_inicio ? schedule.fecha_inicio.substring(11, 16) : '';
                    const endStr = schedule.fecha_fin ? schedule.fecha_fin.substring(11, 16) : '';

                    return (
                      <div
                        key={schedule.id_agenda}
                        className="daily-schedule-card"
                        style={{ '--item-color': color }}
                        onClick={() => onSelectSchedule(schedule)}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '3px',
                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                color
                              }}
                            >
                              {schedule.categoria_nombre}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {startStr} - {endStr}
                            </span>
                          </div>

                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {schedule.titulo}
                          </div>

                          {schedule.descripcion && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {schedule.descripcion}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {schedule.responsable_nombre && (
                              <span>👤 Responsable: <strong style={{ color: 'var(--text-main)' }}>{schedule.responsable_nombre}</strong></span>
                            )}
                            {schedule.ubicacion && (
                              <span>📍 Ubicación: <strong style={{ color: 'var(--text-main)' }}>{schedule.ubicacion}</strong></span>
                            )}
                            {schedule.total_notas > 0 && (
                              <span>📝 {schedule.total_notas} notas operativas</span>
                            )}
                          </div>
                        </div>

                        <button type="button" className="btn btn-secondary btn-sm">
                          Ver Detalle →
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

