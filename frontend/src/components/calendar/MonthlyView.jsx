import React from 'react';

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const MonthlyView = ({
  currentDate,
  schedules = [],
  onSelectSchedule,
  onDayClick
}) => {
  // Generar la cuadrícula mensual de Lunes a Domingo
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // En JS getDay(): 0 = Domingo, 1 = Lunes ... 6 = Sábado
  // Ajustar a Lunes = 0, Domingo = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const totalDaysInMonth = lastDayOfMonth.getDate();
  const calendarCells = [];

  // Días del mes anterior para rellenar
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    calendarCells.push({
      dayNumber: d,
      dateStr: `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  // Días del mes actual
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr
    });
  }

  // Días del próximo mes para completar la última semana
  const remainingCells = 7 - (calendarCells.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      calendarCells.push({
        dayNumber: d,
        dateStr: `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false
      });
    }
  }

  // Mapear agendas por fecha YYYY-MM-DD
  const getSchedulesForDate = (dateStr) => {
    return schedules.filter((s) => s.fecha_inicio && s.fecha_inicio.startsWith(dateStr));
  };

  return (
    <div className="monthly-calendar-wrapper">
      {/* Encabezados de Lunes a Domingo */}
      <div className="monthly-header-grid">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="monthly-header-cell">
            {wd}
          </div>
        ))}
      </div>

      {/* Celdas de Días */}
      <div className="monthly-days-grid">
        {calendarCells.map((cell, idx) => {
          const daySchedules = getSchedulesForDate(cell.dateStr);
          const visibleSchedules = daySchedules.slice(0, 3);
          const extraCount = daySchedules.length - 3;

          return (
            <div
              key={`${cell.dateStr}_${idx}`}
              className={`monthly-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}`}
              onClick={() => onDayClick?.(cell.dateStr)}
            >
              <div className="monthly-day-num">{cell.dayNumber}</div>

              {visibleSchedules.map((schedule) => {
                const color = schedule.color_identificador || 'var(--gold-primary)';
                const startStr = schedule.fecha_inicio ? schedule.fecha_inicio.substring(11, 16) : '';

                return (
                  <div
                    key={schedule.id_agenda}
                    className="monthly-schedule-pill"
                    style={{ '--item-color': color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSchedule(schedule);
                    }}
                    title={`${schedule.titulo} (${startStr})`}
                  >
                    <span>{startStr}</span> {schedule.titulo}
                  </div>
                );
              })}

              {extraCount > 0 && (
                <div className="monthly-more-indicator">
                  +{extraCount} más...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

